'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Clock, Star, ChevronRight, ChevronLeft, CheckCircle2, 
  Sparkles, BookOpen, Users, TrendingUp, MenuBook, Psychology, 
  ArrowForward, Star as StarIcon, FormatQuote
} from 'lucide-react';
import { DimensionChart } from '@/components/dimension-chart';

interface Question {
  id: number;
  type: '韦氏智力测评' | '多元智能测评';
  dimension: string;
  question: string;
  options: { value: number; label: string }[];
}

interface AssessmentInfo {
  title: string;
  theoreticalBasis: string;
  description: string;
  features: Array<{ icon: string; title: string; description: string }>;
  dimensions: string[];
  reportDescription: string;
}

interface Answer {
  questionId: number;
  score: number;
  dimension: string;
  assessmentType: string;
}

export default function AssessmentPage() {
  const [status, setStatus] = useState<'intro' | 'info' | 'quiz' | 'analyzing' | 'report'>('intro');
  const [childInfo, setChildInfo] = useState({ name: '', age: '' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessmentInfo, setAssessmentInfo] = useState<AssessmentInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [analysisResult, setAnalysisResult] = useState('');
  const [analyzingProgress, setAnalyzingProgress] = useState(0);

  // 加载数据
  useEffect(() => {
    fetch('/api/questions')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setQuestions(data.data.questions);
          setAssessmentInfo(data.data.assessmentInfo);
        }
      });
  }, []);

  // 提交答案
  const submitAnswer = (value: number) => {
    const question = questions[currentQuestion];
    const newAnswer: Answer = {
      questionId: question.id,
      score: value,
      dimension: question.dimension,
      assessmentType: question.type,
    };
    setAnswers([...answers, newAnswer]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 所有问题回答完毕
      setStatus('analyzing');
      analyzeAnswers([...answers, newAnswer]);
    }
  };

  // AI 分析
  const analyzeAnswers = async (allAnswers: Answer[]) => {
    setAnalyzingProgress(0);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: allAnswers,
          childName: childInfo.name,
          childAge: childInfo.age,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "分析请求失败");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          
          // 检查错误标记
          const errorMatch = chunk.match(/\[ERROR\](.*?)\[\/ERROR\]/);
          if (errorMatch) {
            throw new Error(errorMatch[1]);
          }
          
          result += chunk;
          setAnalysisResult(result);
          setAnalyzingProgress(Math.min((result.length / 500) * 100, 95));
        }
      }

      setAnalyzingProgress(100);
      setTimeout(() => setStatus('report'), 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '分析失败';
      alert(`分析失败: ${errorMessage}`);
      setStatus('quiz');
    }
  };

  const startAssessment = () => {
    if (childInfo.name.trim() && childInfo.age) {
      setStatus('quiz');
      setCurrentQuestion(0);
      setAnswers([]);
    }
  };

  // 计算维度得分
  const getDimensionScores = () => {
    const scores: Record<string, { total: number; count: number }> = {};
    answers.forEach(answer => {
      if (!scores[answer.dimension]) {
        scores[answer.dimension] = { total: 0, count: 0 };
      }
      scores[answer.dimension].total += answer.score;
      scores[answer.dimension].count += 1;
    });
    
    return Object.entries(scores).map(([dimension, data]) => ({
      dimension,
      score: data.count > 0 ? Math.round((data.total / (data.count * 5)) * 100) : 0,
    }));
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // 专家推荐数据
  const testimonials = [
    {
      quote: "我们收到的报告不仅是数字，更是女儿教育的导航图。我们终于理解了她最好的学习方式。",
      author: "Sarah Jenkins",
      role: "7岁孩子的母亲",
    },
    {
      quote: "作为一名临床医生，我对智学博悦体系的严谨性印象深刻。它弥补了实验室级测试与家庭可及洞察之间的鸿沟。",
      author: "Marcus Aris 博士",
      role: "儿科神经心理学家",
      featured: true,
    },
    {
      quote: "我向所有学生的家长推荐这个系统。这是目前针对认知多样化学习者最全面的评估方式。",
      author: "Elena Rodriguez",
      role: "特殊教育组长",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 - Glass morphism 风格 */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="text-xl font-bold text-[#022846] tracking-tight">
            智学博悦
          </div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium">
            <a className="text-[#181c1c] font-semibold border-b-2 border-[#022846] pb-1" href="#">探索</a>
            <a className="text-[#43474c] hover:text-[#181c1c] transition-colors" href="#">关于我们</a>
            <a className="text-[#43474c] hover:text-[#181c1c] transition-colors" href="#">测评报告</a>
          </div>
          <div className="flex items-center gap-4">
            <Button className="px-5 py-2 rounded-full bg-[#022846] text-white font-semibold hover:scale-95 active:scale-90 transition-all">
              个人中心
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-24 overflow-x-hidden">
        {/* 欢迎页面 - 专业风格 */}
        {status === "intro" && assessmentInfo && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 z-10">
                  <span className="inline-block py-1 px-4 mb-6 rounded-full bg-[#ccebc7] text-[#506b4f] text-xs font-bold tracking-widest uppercase">
                    赋能探索发现
                  </span>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-[#022846] leading-tight tracking-tight mb-6">
                    探索孩子的<span className="text-[#4a6549]">独特潜能：</span>AI驱动的智能测评
                  </h1>
                  <p className="text-xl text-[#43474c] max-w-2xl leading-relaxed mb-10">
                    唯一结合韦氏认知技能与加德纳多元智能理论的深度测评系统。
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={() => setStatus('info')}
                      className="px-8 py-4 rounded-full bg-gradient-to-br from-[#022846] to-[#1f3e5d] text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      开始首次免费测评
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                </div>
                <div className="lg:col-span-5 relative">
                  {/* 装饰性背景 */}
                  <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden shadow-2xl z-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ccebc7] to-[#d1e4ff] flex items-center justify-center">
                      <Brain className="w-32 h-32 text-[#022846] opacity-20" />
                    </div>
                  </div>
                  {/* 装饰元素 */}
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#4a6549]/10 rounded-full blur-3xl z-0"></div>
                  <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-[#ffdcc5]/30 rounded-full blur-2xl z-0"></div>
                  {/* 统计数据卡片 */}
                  <div className="absolute bottom-12 -left-16 hidden xl:block z-30 p-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#ccebc7] flex items-center justify-center">
                        <Psychology className="w-6 h-6 text-[#4a6549]" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#022846]">98%</div>
                        <div className="text-xs text-[#43474c]">评估准确率</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 特点展示 */}
            <section className="bg-[#f1f4f3] py-16 px-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-12 text-center">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#022846] mb-4 tracking-tight">我们的精准测评体系</h2>
                  <p className="text-[#43474c] max-w-xl mx-auto">精密的方法论结合直观的设计，揭示孩子内心隐藏的认知架构。</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* 科学依据 */}
                  <Card className="p-8 rounded-3xl bg-white shadow-sm hover:shadow-md transition-all border-0">
                    <CardContent className="p-0">
                      <div className="w-14 h-14 rounded-2xl bg-[#022846]/5 flex items-center justify-center mb-6">
                        <MenuBook className="w-7 h-7 text-[#022846]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#022846] mb-4">科学依据</h3>
                      <p className="text-[#43474c] leading-relaxed">基于心理测量学的黄金标准，我们的测评利用经临床验证的认知模型，提供无可比拟的分析深度。</p>
                    </CardContent>
                  </Card>
                  {/* AI智能分析 */}
                  <Card className="p-8 rounded-3xl bg-white shadow-sm hover:shadow-md transition-all border-2 border-[#4a6549]/10 scale-105 z-10">
                    <CardContent className="p-0">
                      <div className="w-14 h-14 rounded-2xl bg-[#4a6549]/5 flex items-center justify-center mb-6">
                        <Psychology className="w-7 h-7 text-[#4a6549]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#022846] mb-4">AI智能分析</h3>
                      <p className="text-[#43474c] leading-relaxed">我们专有的算法通过分析行为模式和反应延迟，提供360度的全方位认知画像。</p>
                    </CardContent>
                  </Card>
                  {/* 专业成长路径 */}
                  <Card className="p-8 rounded-3xl bg-white shadow-sm hover:shadow-md transition-all border-0">
                    <CardContent className="p-0">
                      <div className="w-14 h-14 rounded-2xl bg-[#ffdcc5]/30 flex items-center justify-center mb-6">
                        <TrendingUp className="w-7 h-7 text-[#f78b30]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#022846] mb-4">专业成长路径</h3>
                      <p className="text-[#43474c] leading-relaxed">我们不仅提供数据，更提供路线图。为教育者和临床专家量身定制的可执行策略。</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* 方法论介绍 */}
            <section className="py-16 px-6 max-w-7xl mx-auto overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="relative order-2 lg:order-1">
                  {/* 雷达图可视化 */}
                  <div className="relative w-full aspect-square flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#4a6549]/5 rounded-full blur-3xl"></div>
                    <div className="relative w-72 h-72 md:w-80 md:h-80 border border-[#022846]/10 rounded-full flex items-center justify-center p-8">
                      <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
                        <polygon fill="none" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="#c4c6cd" strokeWidth="0.5"></polygon>
                        <polygon fill="none" points="50,20 80,35 80,65 50,80 20,65 20,35" stroke="#c4c6cd" strokeWidth="0.5"></polygon>
                        <polygon fill="#4a6549" fillOpacity="0.2" points="50,15 85,30 75,80 50,85 15,65 30,25" stroke="#4a6549" strokeWidth="1.5"></polygon>
                        <circle cx="50" cy="15" fill="#022846" r="2"></circle>
                        <circle cx="85" cy="30" fill="#022846" r="2"></circle>
                        <circle cx="75" cy="80" fill="#022846" r="2"></circle>
                        <circle cx="50" cy="85" fill="#022846" r="2"></circle>
                        <circle cx="15" cy="65" fill="#022846" r="2"></circle>
                        <circle cx="30" cy="25" fill="#022846" r="2"></circle>
                      </svg>
                    </div>
                    {/* 浮动标签 */}
                    <span className="absolute top-0 right-4 py-2 px-4 bg-[#ccebc7] text-[#506b4f] rounded-full text-xs font-bold">语言能力</span>
                    <span className="absolute bottom-8 right-0 py-2 px-4 bg-[#ccebc7] text-[#506b4f] rounded-full text-xs font-bold">空间想象</span>
                    <span className="absolute top-1/2 -left-4 py-2 px-4 bg-[#022846] text-white rounded-full text-xs font-bold">韦氏量表</span>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#022846] mb-8 tracking-tight">韦氏智力 + 多元智能深度融合</h2>
                  <div className="space-y-8">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#022846] text-white flex items-center justify-center font-bold">1</div>
                      <div>
                        <h4 className="text-xl font-bold text-[#022846] mb-2">认知核心 (韦氏)</h4>
                        <p className="text-[#43474c]">我们评估智力的基石：利用临床验证的指标分析加工速度、工作记忆和流体推理。</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#4a6549] text-white flex items-center justify-center font-bold">2</div>
                      <div>
                        <h4 className="text-xl font-bold text-[#022846] mb-2">表达天赋 (加德纳)</h4>
                        <p className="text-[#43474c]">超越传统的逻辑评估，我们测绘孩子在人际、音乐和动觉领域的自然倾向。</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#f78b30] text-white flex items-center justify-center font-bold">3</div>
                      <div>
                        <h4 className="text-xl font-bold text-[#022846] mb-2">AI综合洞察</h4>
                        <p className="text-[#43474c]">我们的引擎分析原始认知能力与特定智能领域之间的相关性，揭示真正的成长路径。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 专家推荐 */}
            <section className="bg-[#f7faf9] py-16 px-6 border-t border-[#c4c6cd]/10">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#022846] tracking-tight">专家推荐</h2>
                    <p className="text-[#43474c] mt-2">经儿科专家验证，深受全球家长信赖。</p>
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => (
                      <StarIcon key={i} className="w-5 h-5 fill-[#f78b30] text-[#f78b30]" />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {testimonials.map((item, index) => (
                    <div 
                      key={index} 
                      className={`p-8 rounded-3xl relative ${item.featured ? 'bg-[#022846] text-white' : 'bg-white'}`}
                    >
                      <div className="absolute -top-4 -left-4 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center">
                        <FormatQuote className={`w-5 h-5 ${item.featured ? 'text-[#022846]' : 'text-[#022846]'}`} />
                      </div>
                      <p className="text-lg italic mb-8 leading-relaxed">{item.quote}</p>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${item.featured ? 'bg-white/20' : 'bg-gray-200'}`}></div>
                        <div>
                          <div className={`font-bold ${item.featured ? 'text-white' : 'text-[#022846]'}`}>{item.author}</div>
                          <div className={`text-xs ${item.featured ? 'text-white/70' : 'text-[#43474c]'}`}>{item.role}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-6 text-center">
              <div className="max-w-3xl mx-auto bg-[#ccebc7]/30 p-12 md:p-16 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#4a6549]/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#022846] mb-6">准备好发现他们的闪光点了吗？</h2>
                <p className="text-lg text-[#43474c] mb-10">加入超过25,000名已解锁孩子认知地图的家长行列。</p>
                <Button 
                  onClick={() => setStatus('info')}
                  className="px-10 py-5 rounded-full bg-[#022846] text-white font-extrabold text-lg hover:scale-105 transition-transform shadow-xl"
                >
                  立即免费开始
                </Button>
              </div>
            </section>

            {/* 页脚 */}
            <footer className="w-full py-8 px-6 bg-[#f1f4f3] border-t border-[#c4c6cd]/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
                <div className="flex flex-col items-center md:items-start">
                  <div className="text-lg font-bold text-[#181c1c]">智学博悦</div>
                  <div className="text-[#43474c] text-xs mt-1">© 2024 智学博悦。科学智能测评。</div>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  <a className="text-[#43474c] hover:text-[#4a6549] transition-colors text-xs" href="#">隐私政策</a>
                  <a className="text-[#43474c] hover:text-[#4a6549] transition-colors text-xs" href="#">服务条款</a>
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* 孩子信息页面 */}
        {status === "info" && (
          <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md bg-white rounded-3xl shadow-xl border-0">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#022846] text-white mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#022846]">欢迎开始测评</h2>
                  <p className="text-[#43474c] mt-2">请输入孩子的基本信息</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#181c1c] font-medium">孩子姓名</Label>
                    <Input
                      id="name"
                      placeholder="请输入姓名"
                      value={childInfo.name}
                      onChange={(e) => setChildInfo({ ...childInfo, name: e.target.value })}
                      className="rounded-xl border-[#c4c6cd] focus:border-[#022846] focus:ring-[#022846]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-[#181c1c] font-medium">孩子年龄</Label>
                    <Input
                      id="age"
                      type="number"
                      min="6"
                      max="12"
                      placeholder="6-12岁"
                      value={childInfo.age}
                      onChange={(e) => setChildInfo({ ...childInfo, age: e.target.value })}
                      className="rounded-xl border-[#c4c6cd] focus:border-[#022846] focus:ring-[#022846]"
                    />
                  </div>
                  <Button
                    onClick={startAssessment}
                    disabled={!childInfo.name.trim() || !childInfo.age}
                    className="w-full py-6 rounded-full bg-[#022846] text-white font-bold text-lg hover:bg-[#1f3e5d] transition-all"
                  >
                    开始测评
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 答题页面 */}
        {status === "quiz" && currentQ && (
          <div className="min-h-screen flex flex-col">
            {/* 顶部进度 */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#c4c6cd]/20 z-10">
              <div className="max-w-2xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#43474c]">
                    第 {currentQuestion + 1} / {questions.length} 题
                  </span>
                  <span className="text-sm font-medium text-[#022846]">
                    {currentQ.type}
                  </span>
                </div>
                <Progress value={progress} className="h-2 rounded-full bg-[#e0e3e2] [&>div]:bg-[#4a6549]" />
              </div>
            </div>

            {/* 题目内容 */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <Card className="w-full max-w-2xl bg-white rounded-3xl shadow-lg border-0">
                <CardContent className="p-8">
                  <div className="mb-8">
                    <span className="inline-block py-1 px-3 rounded-full bg-[#ccebc7] text-[#506b4f] text-xs font-medium mb-4">
                      {currentQ.dimension}
                    </span>
                    <p className="text-xl text-[#181c1c] leading-relaxed">{currentQ.question}</p>
                  </div>

                  <RadioGroup
                    onValueChange={(v) => submitAnswer(parseInt(v))}
                    className="space-y-3"
                  >
                    {currentQ.options.map((option, index) => (
                      <div
                        key={option.value}
                        className="flex items-center p-4 rounded-xl border-2 border-[#e0e3e2] hover:border-[#4a6549] hover:bg-[#ccebc7]/10 cursor-pointer transition-all"
                      >
                        <RadioGroupItem value={option.value.toString()} id={`option-${index}`} className="text-[#4a6549]" />
                        <label
                          htmlFor={`option-${index}`}
                          className="flex-1 ml-3 text-[#181c1c] cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#c4c6cd]/20">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                      className="text-[#43474c] hover:text-[#022846]"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      上一题
                    </Button>
                    <span className="text-sm text-[#43474c]">
                      {answers.length} 题已答
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 分析中页面 */}
        {status === "analyzing" && (
          <div className="min-h-screen flex items-center justify-center px-4">
            <Card className="w-full max-w-lg bg-white rounded-3xl shadow-xl border-0 p-8 text-center">
              <CardContent className="p-0">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full bg-[#ccebc7] animate-ping"></div>
                  <div className="relative w-24 h-24 rounded-full bg-[#4a6549] flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[#022846] mb-4">AI正在分析中...</h2>
                <p className="text-[#43474c] mb-8">
                  正在结合韦氏智力框架和多元智能理论，为 {childInfo.name} 生成个性化报告
                </p>
                <div className="space-y-4">
                  <Progress value={analyzingProgress} className="h-3 rounded-full bg-[#e0e3e2] [&>div]:bg-[#4a6549]" />
                  <p className="text-sm text-[#43474c]">{Math.round(analyzingProgress)}%</p>
                </div>
                {analysisResult && (
                  <div className="mt-8 p-4 rounded-xl bg-[#f1f4f3] text-left max-h-48 overflow-y-auto">
                    <p className="text-sm text-[#181c1c] whitespace-pre-wrap">{analysisResult}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 报告页面 */}
        {status === "report" && (
          <div className="min-h-screen pb-12">
            {/* 报告头部 */}
            <div className="text-center mb-8 px-4 pt-8">
              <div className="inline-flex items-center gap-2 bg-[#ccebc7] text-[#506b4f] px-4 py-2 rounded-full text-sm font-medium mb-4">
                <CheckCircle2 className="w-4 h-4" />
                测评完成
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#022846] mb-2">
                {childInfo.name}的天赋测评报告
              </h1>
              <p className="text-[#43474c]">
                基于韦氏智力测评框架 + 多元智能理论 | 共 {questions.length} 题
              </p>
            </div>

            {/* 雷达图 */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
              <Card className="rounded-3xl bg-white shadow-lg border-0 p-6">
                <CardContent className="p-0">
                  <h2 className="text-xl font-bold text-[#022846] mb-6 text-center">天赋雷达图</h2>
                  <DimensionChart dimensionScores={getDimensionScores()} />
                </CardContent>
              </Card>
            </div>

            {/* 详细分析 */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
              <Card className="rounded-3xl bg-white shadow-lg border-0 p-6">
                <CardContent className="p-0">
                  <h2 className="text-xl font-bold text-[#022846] mb-6">AI分析报告</h2>
                  <div className="prose prose-sm max-w-none text-[#43474c] whitespace-pre-wrap">
                    {analysisResult || '正在加载分析报告...'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 重新开始按钮 */}
            <div className="text-center px-4">
              <Button
                onClick={() => {
                  setStatus('intro');
                  setChildInfo({ name: '', age: '' });
                  setAnswers([]);
                  setCurrentQuestion(0);
                  setAnalysisResult('');
                }}
                variant="outline"
                className="rounded-full border-2 border-[#c4c6cd] text-[#43474c] hover:bg-[#f1f4f3]"
              >
                返回首页
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
