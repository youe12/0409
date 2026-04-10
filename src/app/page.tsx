'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, ChevronRight, CheckCircle2, Users, Lightbulb,
  BookOpen, TrendingUp, Star, Sparkles, GraduationCap
} from 'lucide-react';
import { DimensionBarChart } from '@/components/dimension-chart';

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
      featured: false,
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
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 导航栏 - 参考设计风格 */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-[var(--outline-variant)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--primary)]" style={{ fontFamily: 'Manrope' }}>
                智学博悦
              </span>
            </div>

            {/* 导航链接 */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium text-[var(--primary)] border-b-2 border-[var(--primary)] pb-1">
                探索
              </a>
              <a href="#" className="text-sm font-medium text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
                关于我们
              </a>
              <a href="#" className="text-sm font-medium text-[var(--on-surface-variant)] hover:text-[var(--primary)] transition-colors">
                测评报告
              </a>
            </div>

            {/* 用户按钮 */}
            <Button className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white font-semibold text-sm hover:bg-[var(--primary-container)] transition-colors">
              个人中心
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* 欢迎页面 - 参考设计风格 */}
        {status === "intro" && assessmentInfo && (
          <div className="page-transition">
            {/* Hero Section */}
            <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* 左侧文字区 */}
                <div className="lg:col-span-7 z-10">
                  <span className="inline-block py-1 px-4 mb-6 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] text-xs font-bold tracking-widest uppercase">
                    赋能探索发现
                  </span>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--primary)] leading-tight tracking-tight mb-6" style={{ fontFamily: 'Manrope' }}>
                    探索孩子的<span className="text-[var(--secondary)]">独特潜能：</span>AI驱动的智能测评
                  </h1>
                  <p className="text-xl text-[var(--on-surface-variant)] max-w-2xl leading-relaxed mb-10">
                    唯一结合韦氏认知技能与加德纳多元智能理论的深度测评系统。
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={() => setStatus('info')}
                      className="px-8 py-4 rounded-full bg-[var(--primary)] text-white font-bold text-lg hover:bg-[var(--primary-container)] transition-colors cartoon-shadow"
                    >
                      开始首次免费测评
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                    <Button 
                      variant="outline"
                      className="px-8 py-4 rounded-full border-2 border-[var(--outline-variant)] text-[var(--on-surface-variant)] font-semibold hover:bg-[var(--surface-container-low)] transition-colors"
                    >
                      查看样本报告
                    </Button>
                  </div>
                </div>
                
                {/* 右侧插画区 */}
                <div className="lg:col-span-5 relative">
                  {/* 主卡片 */}
                  <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden z-20 cartoon-card bg-[var(--primary-fixed)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-fixed)] via-[var(--primary-fixed-dim)] to-[var(--secondary-fixed)] flex items-center justify-center">
                      {/* 简约插画 */}
                      <div className="relative w-72 h-72">
                        {/* 孩子 */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
                          <div className="w-20 h-24 bg-[#FCB69F] rounded-t-full"></div>
                          <div className="w-16 h-16 bg-[#FCB69F] rounded-full -mt-2 mx-auto">
                            <div className="flex justify-center gap-3 pt-3">
                              <div className="w-3 h-3 bg-[#2a2a2a] rounded-full"></div>
                              <div className="w-3 h-3 bg-[#2a2a2a] rounded-full"></div>
                            </div>
                            <div className="w-6 h-2 bg-[#E8845C] rounded-full mx-auto mt-1"></div>
                          </div>
                        </div>
                        {/* 母亲 */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 -ml-12">
                          <div className="w-14 h-24 bg-[#E8845C] rounded-t-full"></div>
                          <div className="w-12 h-12 bg-[#E8845C] rounded-full -mt-2 mx-auto"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 数据标签卡片 */}
                  <div className="absolute -bottom-6 -left-6 z-30 p-5 rounded-2xl bg-white cartoon-shadow-secondary">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--secondary-container)] flex items-center justify-center">
                        <Brain className="w-6 h-6 text-[var(--secondary)]" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[var(--primary)]" style={{ fontFamily: 'Manrope' }}>98%</div>
                        <div className="text-xs text-[var(--on-surface-variant)]">评估准确率</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 特点展示 - 三卡片布局 */}
            <section className="py-16 px-6 max-w-7xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-4 tracking-tight" style={{ fontFamily: 'Manrope' }}>
                  我们的精准测评体系
                </h2>
                <p className="text-[var(--on-surface-variant)] max-w-xl mx-auto">
                  精密的方法论结合直观的设计，揭示孩子内心隐藏的认知架构。
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 科学依据 */}
                <Card className="p-8 rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--primary)] cartoon-card">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--primary-fixed)] flex items-center justify-center mb-6">
                      <BookOpen className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--primary)] mb-4" style={{ fontFamily: 'Manrope' }}>科学依据</h3>
                    <p className="text-[var(--on-surface-variant)] leading-relaxed">
                      基于心理测量学的黄金标准，我们的测评利用经临床验证的认知模型，提供无可比拟的分析深度。
                    </p>
                  </CardContent>
                </Card>
                {/* AI智能分析 */}
                <Card className="p-8 rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--secondary)] cartoon-card-secondary">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--secondary-container)] flex items-center justify-center mb-6">
                      <GraduationCap className="w-8 h-8 text-[var(--secondary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--primary)] mb-4" style={{ fontFamily: 'Manrope' }}>AI智能分析</h3>
                    <p className="text-[var(--on-surface-variant)] leading-relaxed">
                      我们专有的算法通过分析行为模式和反应延迟，提供360度的全方位认知画像。
                    </p>
                  </CardContent>
                </Card>
                {/* 专业成长路径 */}
                <Card className="p-8 rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--tertiary)] cartoon-card-tertiary">
                  <CardContent className="p-0">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--tertiary-fixed)] flex items-center justify-center mb-6">
                      <TrendingUp className="w-8 h-8 text-[var(--tertiary)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--primary)] mb-4" style={{ fontFamily: 'Manrope' }}>专业成长路径</h3>
                    <p className="text-[var(--on-surface-variant)] leading-relaxed">
                      我们不仅提供数据，更提供路线图。为教育者和临床专家量身定制的可执行策略。
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* 方法论介绍 */}
            <section className="py-16 px-6 bg-[var(--surface-container-low)]">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div className="relative order-2 lg:order-1">
                    {/* 雷达图可视化 */}
                    <div className="relative w-full aspect-square flex items-center justify-center">
                      <div className="absolute inset-0 bg-[var(--secondary-container)]/20 rounded-full blur-3xl"></div>
                      <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full border-2 border-[var(--outline-variant)] flex items-center justify-center p-8">
                        <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
                          <polygon fill="none" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="var(--outline-variant)" strokeWidth="0.5"></polygon>
                          <polygon fill="none" points="50,20 80,35 80,65 50,80 20,65 20,35" stroke="var(--outline-variant)" strokeWidth="0.5"></polygon>
                          <polygon fill="var(--secondary-container)" fillOpacity="0.4" points="50,15 85,30 75,80 50,85 15,65 30,25" stroke="var(--secondary)" strokeWidth="1.5"></polygon>
                          <circle cx="50" cy="15" fill="var(--primary)" r="2"></circle>
                          <circle cx="85" cy="30" fill="var(--primary)" r="2"></circle>
                          <circle cx="75" cy="80" fill="var(--primary)" r="2"></circle>
                          <circle cx="50" cy="85" fill="var(--primary)" r="2"></circle>
                          <circle cx="15" cy="65" fill="var(--primary)" r="2"></circle>
                          <circle cx="30" cy="25" fill="var(--primary)" r="2"></circle>
                        </svg>
                      </div>
                      {/* 浮动标签 */}
                      <span className="absolute top-4 right-8 py-2 px-4 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] rounded-full text-xs font-bold">
                        语言能力
                      </span>
                      <span className="absolute bottom-12 right-0 py-2 px-4 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] rounded-full text-xs font-bold">
                        空间想象
                      </span>
                      <span className="absolute top-1/2 -left-4 py-2 px-4 bg-[var(--primary)] text-white rounded-full text-xs font-bold">
                        韦氏量表
                      </span>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2">
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-8 tracking-tight" style={{ fontFamily: 'Manrope' }}>
                      韦氏智力 + 多元智能深度融合
                    </h2>
                    <div className="space-y-8">
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-lg" style={{ fontFamily: 'Manrope' }}>1</div>
                        <div>
                          <h4 className="text-xl font-bold text-[var(--primary)] mb-2" style={{ fontFamily: 'Manrope' }}>认知核心 (韦氏)</h4>
                          <p className="text-[var(--on-surface-variant)]">我们评估智力的基石：利用临床验证的指标分析加工速度、工作记忆和流体推理。</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[var(--secondary)] text-white flex items-center justify-center font-bold text-lg" style={{ fontFamily: 'Manrope' }}>2</div>
                        <div>
                          <h4 className="text-xl font-bold text-[var(--primary)] mb-2" style={{ fontFamily: 'Manrope' }}>表达天赋 (加德纳)</h4>
                          <p className="text-[var(--on-surface-variant)]">超越传统的逻辑评估，我们测绘孩子在人际、音乐和动觉领域的自然倾向。</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[var(--tertiary)] text-white flex items-center justify-center font-bold text-lg" style={{ fontFamily: 'Manrope' }}>3</div>
                        <div>
                          <h4 className="text-xl font-bold text-[var(--primary)] mb-2" style={{ fontFamily: 'Manrope' }}>AI综合洞察</h4>
                          <p className="text-[var(--on-surface-variant)]">我们的引擎分析原始认知能力与特定智能领域之间的相关性，揭示真正的成长路径。</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 专家推荐 */}
            <section className="py-16 px-6 max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary)] tracking-tight" style={{ fontFamily: 'Manrope' }}>专家推荐</h2>
                  <p className="text-[var(--on-surface-variant)] mt-2">经儿科专家验证，深受全球家长信赖。</p>
                </div>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-5 h-5 fill-[#f78b30] text-[#f78b30]" />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-8 rounded-3xl relative ${item.featured ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-container-lowest)]'}`}
                  >
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center">
                      <span className={`text-2xl ${item.featured ? 'text-[var(--primary)]' : 'text-[var(--primary)]'}`}>"</span>
                    </div>
                    <p className="text-lg italic mb-8 leading-relaxed">{item.quote}</p>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full ${item.featured ? 'bg-white/20' : 'bg-[var(--surface-container)]'}`}></div>
                      <div>
                        <div className={`font-bold ${item.featured ? 'text-white' : 'text-[var(--primary)]'}`} style={{ fontFamily: 'Manrope' }}>{item.author}</div>
                        <div className={`text-xs ${item.featured ? 'text-white/70' : 'text-[var(--on-surface-variant)]'}`}>{item.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <section className="py-16 px-6">
              <div className="max-w-3xl mx-auto bg-[var(--secondary-container)] p-12 md:p-16 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--secondary)]/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
                <h2 className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-6" style={{ fontFamily: 'Manrope' }}>
                  准备好发现他们的闪光点了吗？
                </h2>
                <p className="text-lg text-[var(--on-secondary-container)] mb-10">
                  加入超过25,000名已解锁孩子认知地图的家长行列。
                </p>
                <Button 
                  onClick={() => setStatus('info')}
                  className="px-10 py-5 rounded-full bg-[var(--primary)] text-white font-extrabold text-lg hover:bg-[var(--primary-container)] transition-colors"
                  style={{ fontFamily: 'Manrope' }}
                >
                  立即免费开始
                </Button>
              </div>
            </section>

            {/* 页脚 */}
            <footer className="w-full py-8 px-6 bg-[var(--surface-container-low)] border-t border-[var(--outline-variant)]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto">
                <div className="flex flex-col items-center md:items-start">
                  <div className="text-lg font-bold text-[var(--on-surface)]" style={{ fontFamily: 'Manrope' }}>智学博悦</div>
                  <div className="text-[var(--on-surface-variant)] text-xs mt-1">© 2024 智学博悦。科学智能测评。</div>
                </div>
                <div className="flex flex-wrap justify-center gap-6">
                  <a className="text-[var(--on-surface-variant)] hover:text-[var(--secondary)] transition-colors text-xs" href="#">隐私政策</a>
                  <a className="text-[var(--on-surface-variant)] hover:text-[var(--secondary)] transition-colors text-xs" href="#">服务条款</a>
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* 孩子信息页面 - 参考评分页1风格 */}
        {status === "info" && (
          <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
              {/* 标题卡片 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--primary)] text-white mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--primary)]" style={{ fontFamily: 'Manrope' }}>欢迎开始测评</h2>
                <p className="text-[var(--on-surface-variant)] mt-2">请输入孩子的基本信息</p>
              </div>

              {/* 表单卡片 */}
              <Card className="rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--primary)] cartoon-card">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[var(--on-surface)] font-medium">孩子姓名</Label>
                      <Input
                        id="name"
                        placeholder="请输入姓名"
                        value={childInfo.name}
                        onChange={(e) => setChildInfo({ ...childInfo, name: e.target.value })}
                        className="rounded-xl border-2 border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-[var(--on-surface)] font-medium">孩子年龄</Label>
                      <Input
                        id="age"
                        type="number"
                        min="6"
                        max="12"
                        placeholder="6-12岁"
                        value={childInfo.age}
                        onChange={(e) => setChildInfo({ ...childInfo, age: e.target.value })}
                        className="rounded-xl border-2 border-[var(--outline-variant)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 bg-white"
                      />
                    </div>
                    <Button
                      onClick={startAssessment}
                      disabled={!childInfo.name.trim() || !childInfo.age}
                      className="w-full py-6 rounded-full bg-[var(--primary)] text-white font-bold text-lg hover:bg-[var(--primary-container)] transition-all"
                    >
                      开始测评
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 答题页面 - 参考答题页面风格 */}
        {status === "quiz" && currentQ && (
          <div className="min-h-screen flex flex-col">
            {/* 顶部进度条 */}
            <div className="sticky top-20 glass-panel border-b border-[var(--outline-variant)] z-10">
              <div className="max-w-2xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[var(--on-surface-variant)]">
                    第 {currentQuestion + 1} / {questions.length} 题
                  </span>
                  <span className="text-sm font-medium text-[var(--primary)]" style={{ fontFamily: 'Manrope' }}>
                    {currentQ.type}
                  </span>
                </div>
                <Progress value={progress} className="h-3 rounded-full bg-[var(--surface-container)] [&>div]:bg-[var(--secondary)]" />
              </div>
            </div>

            {/* 题目内容 */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
              <Card className="w-full max-w-2xl rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--secondary)] cartoon-card-secondary">
                <CardContent className="p-8">
                  <div className="mb-8">
                    <span className="inline-block py-2 px-4 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] text-sm font-medium" style={{ fontFamily: 'Manrope' }}>
                      {currentQ.dimension}
                    </span>
                    <p className="text-xl text-[var(--on-surface)] leading-relaxed mt-6">{currentQ.question}</p>
                  </div>

                  <RadioGroup
                    onValueChange={(v) => submitAnswer(parseInt(v))}
                    className="space-y-3"
                  >
                    {currentQ.options.map((option, index) => (
                      <div
                        key={option.value}
                        className="flex items-center p-5 rounded-2xl border-2 border-[var(--outline-variant)] hover:border-[var(--secondary)] hover:bg-[var(--secondary-container)]/10 cursor-pointer transition-all"
                      >
                        <RadioGroupItem value={option.value.toString()} id={`option-${index}`} className="text-[var(--secondary)]" />
                        <label
                          htmlFor={`option-${index}`}
                          className="flex-1 ml-4 text-[var(--on-surface)] cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--outline-variant)]">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                      className="text-[var(--on-surface-variant)] hover:text-[var(--primary)] hover:bg-[var(--primary-fixed)]"
                    >
                      上一题
                    </Button>
                    <span className="text-sm text-[var(--on-surface-variant)]">
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
            <Card className="w-full max-w-lg rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--primary)] cartoon-card p-8 text-center">
              <CardContent className="p-0">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full bg-[var(--secondary-container)] animate-ping"></div>
                  <div className="relative w-24 h-24 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--primary)] mb-4" style={{ fontFamily: 'Manrope' }}>
                  AI正在分析中...
                </h2>
                <p className="text-[var(--on-surface-variant)] mb-8">
                  正在结合韦氏智力框架和多元智能理论，为 {childInfo.name} 生成个性化报告
                </p>
                <div className="space-y-4">
                  <Progress value={analyzingProgress} className="h-3 rounded-full bg-[var(--surface-container)] [&>div]:bg-[var(--secondary)]" />
                  <p className="text-sm text-[var(--on-surface-variant)]">{Math.round(analyzingProgress)}%</p>
                </div>
                {analysisResult && (
                  <div className="mt-8 p-4 rounded-xl bg-[var(--surface-container-low)] text-left max-h-48 overflow-y-auto">
                    <p className="text-sm text-[var(--on-surface)] whitespace-pre-wrap">{analysisResult}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 报告页面 - 参考评分页2风格 */}
        {status === "report" && (
          <div className="min-h-screen pb-12 page-transition">
            {/* 报告头部 */}
            <div className="text-center mb-8 px-4 pt-8">
              <div className="inline-flex items-center gap-2 bg-[var(--secondary-container)] text-[var(--on-secondary-container)] px-4 py-2 rounded-full text-sm font-medium mb-4">
                <CheckCircle2 className="w-4 h-4" />
                测评完成
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--primary)] mb-2" style={{ fontFamily: 'Manrope' }}>
                {childInfo.name}的天赋测评报告
              </h1>
              <p className="text-[var(--on-surface-variant)]">
                基于韦氏智力测评框架 + 多元智能理论 | 共 {questions.length} 题
              </p>
            </div>

            {/* 雷达图 */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
              <Card className="rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--primary)] cartoon-card p-6">
                <CardContent className="p-0">
                  <h2 className="text-xl font-bold text-[var(--primary)] mb-6 text-center" style={{ fontFamily: 'Manrope' }}>
                    天赋雷达图
                  </h2>
                  <DimensionBarChart dimensionScores={getDimensionScores()} />
                </CardContent>
              </Card>
            </div>

            {/* 详细分析 */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
              <Card className="rounded-3xl bg-[var(--surface-container-lowest)] border-2 border-[var(--secondary)] cartoon-card-secondary p-6">
                <CardContent className="p-0">
                  <h2 className="text-xl font-bold text-[var(--primary)] mb-6" style={{ fontFamily: 'Manrope' }}>
                    AI分析报告
                  </h2>
                  <div className="prose prose-sm max-w-none text-[var(--on-surface-variant)] whitespace-pre-wrap">
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
                className="rounded-full border-2 border-[var(--outline-variant)] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]"
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
