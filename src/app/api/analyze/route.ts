import { NextRequest, NextResponse } from "next/server";
import { LLM_CONFIG } from "@/lib/llm-config";

interface Answer {
  questionId: number;
  score: number;
  dimension: string;
  assessmentType: string;
}

interface AnalysisRequest {
  answers: Answer[];
  childName?: string;
  childAge?: number;
}

// 豆包API配置
const DOUBAO_API_URL = process.env.DOUBAO_API_URL || "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || "";

/**
 * 构建分析提示词
 */
function buildAnalysisPrompt(data: AnalysisRequest): string {
  // 按维度计算分数
  const dimensionScores: Record<string, { total: number; count: number }> = {};
  
  data.answers.forEach((answer) => {
    if (!dimensionScores[answer.dimension]) {
      dimensionScores[answer.dimension] = { total: 0, count: 0 };
    }
    dimensionScores[answer.dimension].total += answer.score;
    dimensionScores[answer.dimension].count += 1;
  });

  // 计算各维度平均分
  const dimensionAverages = Object.entries(dimensionScores).map(([name, { total, count }]) => ({
    name,
    average: (total / count).toFixed(2),
    questionsCount: count,
  }));

  const childInfo = data.childName
    ? `孩子姓名：${data.childName}${data.childAge ? `，年龄：${data.childAge}岁` : ''}`
    : "";

  return `请分析以下儿童天赋测评结果：

${childInfo}

【各维度得分情况】（1-5分制）
${dimensionAverages.map(d => `- ${d.name}：平均 ${d.average} 分（共 ${d.questionsCount} 题）`).join('\n')}

【作答详情】
${data.answers.map(a => `题目${a.questionId}（${a.assessmentType}-${a.dimension}）：得分 ${a.score}`).join('\n')}

请按照以下固定格式输出分析报告，严格遵守结构要求：

## 一、总体概述
（100字以内，概括孩子的整体天赋特点）

## 二、各维度详细分析
请对每个维度进行分析，格式如下：
### [维度名称]
- 得分：X分
- 等级：[优秀/良好/中等/需提升/待发展]
- 解读：（2-3句话专业解读）
- 建议：（1句具体可操作的建议）

## 三、天赋优势总结
（列出2-3个最突出的优势领域，简述原因）

## 四、发展建议
1. [建议1]
2. [建议2]
3. [建议3]

## 五、家长互动指南
（50字以内的温馨建议，指导家长如何与孩子互动）`;
}

/**
 * POST /api/analyze
 * 豆包API分析答题结果（流式输出）
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    
    if (!body.answers || !Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json(
        { error: "请提供有效的答题数据" },
        { status: 400 }
      );
    }

    // 检查API密钥
    if (!DOUBAO_API_KEY) {
      return NextResponse.json(
        { error: "未配置豆包API密钥，请设置 DOUBAO_API_KEY 环境变量" },
        { status: 500 }
      );
    }

    const prompt = buildAnalysisPrompt(body);

    // 调用豆包API（流式）
    const response = await fetch(DOUBAO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DOUBAO_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_CONFIG.model,
        messages: [
          { role: "system", content: LLM_CONFIG.systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: true,
        temperature: LLM_CONFIG.temperature,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("豆包API错误:", response.status, errorText);
      return NextResponse.json(
        { error: `AI服务调用失败: ${response.status}` },
        { status: 500 }
      );
    }

    // 流式转发响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            // 解析SSE数据
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  controller.close();
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error("流式读取错误:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("分析请求错误:", error);
    return NextResponse.json(
      { error: "分析服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}
