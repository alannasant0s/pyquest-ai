import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Code, BookOpen, Target, CheckCircle, Circle, Flame, Brain, 
  ChevronRight, Award, Lock, Play, Check, ArrowLeft, RefreshCw, 
  Sparkles, Send, GraduationCap 
} from 'lucide-react';


const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 


const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

const INITIAL_USER = { name: "Alanna", level: 1, xp: 0, streak: 1, coins: 0 };
const LEVEL_THRESHOLDS = [0, 300, 800, 1500, 2500, 4000, 6000, 9000, 13000, 18000];

// --- BANCO DE DADOS ESTÁTICO (Conteúdo) ---

const QUEST_POOLS = {
  beginner: [ 
    { text: "Escrever suas primeiras 3 linhas de código", xp: 30 },
    { text: "Revisar o Módulo 1 (Fundamentos)", xp: 25 },
    { text: "Acertar um desafio de Quiz", xp: 50 },
    { text: "Dar um xero em bô", xp: 15 },
    { text: "Usar o comando 'print' 3 vezes", xp: 20 }
  ],
  intermediate: [
    { text: "Codar por 30 minutos focados", xp: 60 },
    { text: "Criar uma lista com 5 itens em Python", xp: 45 },
    { text: "Usar o Mentor IA para tirar uma dúvida", xp: 40 },
    { text: "Escrever um loop 'for' que funciona", xp: 55 },
    { text: "Resolver 1 exercício de lógica simples", xp: 70 }
  ],
  advanced: [
    { text: "Ler documentação oficial (ex: Math)", xp: 100 },
    { text: "Refatorar um código para PEP 8", xp: 90 },
    { text: "Resolver desafio de algoritmo complexo", xp: 120 },
    { text: "Criar um script de automação", xp: 110 },
    { text: "Codar por 1 hora sem interrupções", xp: 150 }
  ]
};

const ROADMAP_DATA = [
  {
    id: 1,
    module: "Fundamentos Básicos",
    description: "Sintaxe, variáveis e tipos de dados.",
    xpReward: 100,
    status: "completed", 
    topics: ["Print", "Variáveis", "Tipos"],
    content: {
      intro: "Bem-vinda ao Python! Aqui começamos a falar com a máquina.",
      lessons: [
        { title: "Função Print", text: "O comando `print()` serve para mostrar mensagens na tela. Exemplo: `print('Olá Alanna')`." },
        { title: "Variáveis", text: "Variáveis são caixinhas onde guardamos dados. Ex: `nome = 'Alanna'`." },
        { title: "Tipos de Dados", text: "Texto é `str` (String), números inteiros são `int`, e decimais são `float`." }
      ],
      challenge: {
        question: "Qual comando usamos para escrever algo na tela em Python?",
        options: ["echo()", "console.log()", "print()", "write()"],
        correct: 2 
      }
    }
  },
  {
    id: 2,
    module: "O Jeito Python (PEP 8)",
    description: "Escrevendo código bonito e legível.",
    xpReward: 120,
    status: "unlocked", 
    topics: ["Indentação", "Snake Case", "Comentários"],
    content: {
      intro: "Código é lido muito mais vezes do que é escrito. O PEP 8 é o guia de estilo oficial do Python.",
      lessons: [
        { title: "Indentação", text: "Use sempre 4 espaços por nível de indentação. Nada de misturar Tab com Espaço!" },
        { title: "Nomes de Variáveis", text: "Use `snake_case` (letras minúsculas separadas por underline). Ex: `minha_variavel`." },
        { title: "Linhas em Branco", text: "Use linhas em branco para separar funções e classes." }
      ],
      challenge: {
        question: "Segundo o PEP 8, qual é a forma correta de nomear uma variável?",
        options: ["nomeDoUsuario", "NomeUsuario", "nome_do_usuario", "NOME_DO_USUARIO"],
        correct: 2
      }
    }
  },
  {
    id: 3,
    module: "Controle de Fluxo",
    description: "Tomada de decisões e repetições.",
    xpReward: 150,
    status: "locked",
    topics: ["If/Else", "For Loops", "While"],
    content: {
      intro: "Agora seu código vai tomar decisões sozinho!",
      lessons: [
        { title: "If e Else", text: "Usamos `if` para verificar uma condição. `if 10 > 5:` imprime algo." },
        { title: "Indentação", text: "Em Python, o espaço antes da linha é OBRIGATÓRIO." },
        { title: "Loops", text: "O `for` repete algo várias vezes. `for i in range(5):` repete 5 vezes." }
      ],
      challenge: {
        question: "O que acontece se a indentação (espaçamento) estiver errada no Python?",
        options: ["O código fica feio", "Gera um IndentationError", "O Python corrige sozinho", "Nada"],
        correct: 1
      }
    }
  },
  { id: 4, module: "Estruturas de Dados", description: "Listas, Dicionários e Tuplas.", xpReward: 200, status: "locked", topics: ["Listas", "Dicts"], content: { intro: "Organizando dados...", lessons: [], challenge: { question: "?", options: [], correct: 0 } } },
  { id: 5, module: "Funções", description: "Reaproveitamento de código.", xpReward: 250, status: "locked", topics: ["Def", "Return"], content: { intro: "Funções...", lessons: [], challenge: { question: "?", options: [], correct: 0 } } },
  { id: 6, module: "POO", description: "Classes e objetos.", xpReward: 350, status: "locked", topics: ["Class", "Self"], content: { intro: "POO...", lessons: [], challenge: { question: "?", options: [], correct: 0 } } },
  { id: 7, module: "Arquivos", description: "Lendo e escrevendo.", xpReward: 200, status: "locked", topics: ["Open", "With"], content: { intro: "Arquivos...", lessons: [], challenge: { question: "?", options: [], correct: 0 } } }
];

// --- HELPER FUNCTIONS ---

const generateDailyQuests = (level) => {
  let pool = QUEST_POOLS.beginner;
  if (level >= 3 && level <= 5) pool = QUEST_POOLS.intermediate;
  if (level >= 6) pool = QUEST_POOLS.advanced;

  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3).map((q, i) => ({
    id: `daily-${Date.now()}-${i}`,
    text: q.text,
    xp: q.xp,
    completed: false
  }));
};

// --- COMPONENTES VISUAIS ---

const Sidebar = ({ activeTab, setActiveTab, user }) => (
  <nav className="md:w-72 bg-[#0b0d12] border-r border-gray-800 p-6 flex flex-col relative z-20">
    <div className="mb-10 flex items-center gap-3">
        <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/20">
            <Code className="text-blue-500" size={28} />
        </div>
        <div>
            <h1 className="text-lg font-bold text-white leading-none font-brand tracking-tight">PYTHON</h1>
            <h1 className="text-lg font-bold text-blue-500 leading-none font-brand tracking-tight">COM FARINHA</h1>
        </div>
    </div>
    <div className="space-y-2">
      <NavButton icon={Target} label="Dashboard" id="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
      <NavButton icon={BookOpen} label="Trilha" id="roadmap" activeTab={activeTab} setActiveTab={setActiveTab} />
      <NavButton icon={Sparkles} label="Mentor IA" id="mentor" activeTab={activeTab} setActiveTab={setActiveTab} isSpecial />
    </div>
    
    <div className="mt-auto pt-6 border-t border-gray-800/50">
       <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-900 border border-gray-800">
         <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold font-brand shadow-md">
           {user.name.charAt(0)}
         </div>
         <div>
           <p className="text-sm font-bold text-white font-brand">{user.name}</p>
           <p className="text-xs text-blue-400 font-mono">Lvl {user.level}</p>
         </div>
       </div>
    </div>
  </nav>
);

const NavButton = ({ icon: Icon, label, id, activeTab, setActiveTab, isSpecial }) => (
  <button 
    onClick={() => setActiveTab(id)} 
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium 
      ${activeTab === id 
        ? (isSpecial ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-blue-600 text-white shadow-lg shadow-blue-900/20') 
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
  >
    <Icon size={20} /> {label}
  </button>
);

const StudyModuleView = ({ moduleId, roadmap, completeModule, onClose }) => {
  const module = roadmap.find(m => m.id === moduleId);
  const [step, setStep] = useState('intro');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrong, setIsWrong] = useState(false);
  
  if (!module) return null;

  const handleChallengeSubmit = () => {
    if (selectedOption === module.content.challenge.correct) {
      setStep('success');
      completeModule(moduleId);
    } else {
      setIsWrong(true);
      setTimeout(() => setIsWrong(false), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1117] flex flex-col animate-in slide-in-from-bottom duration-300 font-sans">
      <div className="bg-[#0b0d12] border-b border-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider font-brand">Módulo {module.id}</p>
            <h2 className="text-xl font-bold text-white font-brand">{module.module}</h2>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
          <Award size={16} className="text-yellow-500" />
          <span className="text-sm font-bold text-yellow-500">+{module.xpReward} XP</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full custom-scrollbar">
        {step === 'success' ? (
           <div className="flex flex-col items-center justify-center h-full text-center animate-in zoom-in">
             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
               <Check size={40} className="text-white" />
             </div>
             <h2 className="text-3xl font-bold text-white mb-2 font-brand">Módulo Concluído!</h2>
             <p className="text-gray-400">Você dominou {module.module}.</p>
           </div>
        ) : (
          <div className="space-y-8 pb-10">
            <div className="bg-gradient-to-br from-blue-900/20 to-gray-900 p-6 rounded-2xl border border-blue-800/30">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center font-brand">
                <BookOpen className="mr-2 text-blue-400" /> Introdução
              </h3>
              <p className="text-gray-300 leading-relaxed text-lg">{module.content.intro}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {module.content.lessons.map((lesson, idx) => (
                <div key={idx} className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-colors">
                  <h4 className="font-bold text-blue-300 mb-2 font-brand">{lesson.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">{lesson.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-gray-800/80 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-xl">
              <div className="flex items-center mb-6">
                <div className="bg-yellow-500/10 p-2 rounded-lg mr-3">
                  <Brain className="text-yellow-500" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white font-brand">Desafio Prático</h3>
                  <p className="text-sm text-gray-400">Acerte para desbloquear sua XP.</p>
                </div>
              </div>
              <p className="text-lg text-white font-medium mb-6">{module.content.challenge.question}</p>
              <div className="grid gap-3">
                {module.content.challenge.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-4 rounded-xl text-left border transition-all flex justify-between items-center
                      ${selectedOption === idx 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-500'}
                      ${isWrong && selectedOption === idx ? 'animate-shake bg-red-600 border-red-500' : ''}
                    `}
                  >
                    <span className="font-medium">{option}</span>
                    {selectedOption === idx && <CheckCircle size={20} />}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleChallengeSubmit}
                  disabled={selectedOption === null || module.status === 'completed'}
                  className={`px-8 py-3 rounded-xl font-bold text-lg flex items-center space-x-2 transition-all font-brand
                    ${module.status === 'completed' 
                      ? 'bg-green-600 text-white cursor-default'
                      : selectedOption === null 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/20 hover:scale-105'}
                  `}
                >
                  {module.status === 'completed' ? <><span>Concluído</span> <Check size={20} /></> : <><span>Verificar</span> <ChevronRight size={20} /></>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [user, setUser] = useState(INITIAL_USER);
  const [roadmap, setRoadmap] = useState(ROADMAP_DATA);
  const [quests, setQuests] = useState([]); 
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  // Carregar do LocalStorage
  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem('pcf_user_v5'));
      const savedRoadmap = JSON.parse(localStorage.getItem('pcf_roadmap_v5'));
      const savedQuests = JSON.parse(localStorage.getItem('pcf_quests_v5'));

      if (savedUser) setUser(savedUser);
      if (savedRoadmap) {
         // Merge logic para novos conteúdos
         if (savedRoadmap.length < ROADMAP_DATA.length) setRoadmap(ROADMAP_DATA);
         else setRoadmap(savedRoadmap);
      }
      if (savedQuests?.length) setQuests(savedQuests);
      else setQuests(generateDailyQuests(savedUser?.level || 1));
    } catch (e) {
      console.error("Erro ao carregar dados", e);
    }
  }, []);

  // Salvar no LocalStorage
  useEffect(() => {
    localStorage.setItem('pcf_user_v5', JSON.stringify(user));
    localStorage.setItem('pcf_roadmap_v5', JSON.stringify(roadmap));
    localStorage.setItem('pcf_quests_v5', JSON.stringify(quests));
  }, [user, roadmap, quests]);

  const addXP = (amount) => {
    let newXP = user.xp + amount;
    let newLevel = user.level;
    let leveledUp = false;

    const nextLevelXP = LEVEL_THRESHOLDS[user.level] || 99999;
    if (newXP >= nextLevelXP) {
      newLevel += 1;
      leveledUp = true;
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    setUser(prev => ({ ...prev, xp: newXP, level: newLevel, coins: prev.coins + (leveledUp ? 50 : 10) }));
  };

  const completeQuest = (questId) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));
    addXP(quest.xp);
  };

  const completeModule = (moduleId) => {
    const module = roadmap.find(m => m.id === moduleId);
    if (!module || module.status === 'completed') return;

    setRoadmap(prev => prev.map(m => {
      if (m.id === moduleId) return { ...m, status: 'completed' };
      if (m.id === moduleId + 1) return { ...m, status: 'unlocked' };
      return m;
    }));
    addXP(module.xpReward);
    setTimeout(() => setSelectedModuleId(null), 1500); 
  };

  const resetDailyQuests = () => setQuests(generateDailyQuests(user.level));

  // Lógica do Chat (Mentor)
  const [chatMessages, setChatMessages] = useState([{ role: 'model', text: `Olá, ${user.name}! Sou seu Mentor. Dúvidas sobre Python?` }]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsChatLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        setTimeout(() => {
          setChatMessages(prev => [...prev, { role: 'model', text: "Para eu funcionar, você precisa criar o arquivo .env com a chave VITE_GEMINI_API_KEY! (Veja o tutorial do passo a passo)" }]);
          setIsChatLoading(false);
        }, 1000);
        return;
      }

      const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: msg }] }] })
      });
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro ao processar resposta.";
      setChatMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'model', text: "Erro: Verifique sua chave API ou conexão." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const progressXP = user.xp - (LEVEL_THRESHOLDS[user.level - 1] || 0);
  const rangeXP = LEVEL_THRESHOLDS[user.level] - (LEVEL_THRESHOLDS[user.level - 1] || 0);
  const percentage = Math.min(100, Math.max(0, (progressXP / rangeXP) * 100));
  const currentFocus = roadmap.find(m => m.status === 'unlocked');

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 font-sans flex flex-col md:flex-row selection:bg-blue-500/30 font-body">
      {/* Estilos das Fontes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&family=Space+Grotesk:wght@500;700&display=swap');
        .font-brand { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Outfit', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(31, 41, 55, 0.5); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.5); border-radius: 10px; }
      `}</style>
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative custom-scrollbar">
        {showLevelUp && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in duration-300">
            <div className="text-center">
              <Trophy size={80} className="text-yellow-400 mx-auto animate-bounce mb-4" />
              <h2 className="text-5xl font-bold text-white mb-2 font-brand">LEVEL UP!</h2>
              <p className="text-xl text-yellow-500 font-brand">Nível {user.level} Alcançado</p>
            </div>
          </div>
        )}

        {selectedModuleId && (
          <StudyModuleView 
            moduleId={selectedModuleId} 
            roadmap={roadmap}
            completeModule={completeModule}
            onClose={() => setSelectedModuleId(null)} 
          />
        )}

        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <>
              <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-gray-900 p-8 rounded-2xl border border-blue-700/50 shadow-2xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-4xl font-bold text-white mb-2 font-brand">Olá, {user.name}!</h2>
                  <p className="text-blue-200 text-lg">Bora dale?</p>
                </div>
                <div className="mt-8 md:mt-0 relative z-10 w-full md:w-64">
                   <div className="flex justify-between text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
                     <span>Lvl {user.level}</span>
                     <span>Lvl {user.level + 1}</span>
                   </div>
                   <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-700 overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700" style={{ width: `${percentage}%` }} />
                   </div>
                   <p className="text-center text-xs text-gray-500 mt-3 font-medium">{rangeXP - progressXP} XP para evoluir</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center font-brand"><Target className="mr-2 text-red-400" size={20} /> Missões Diárias</h3>
                    <button onClick={resetDailyQuests} className="text-xs flex items-center gap-1 text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold"><RefreshCw size={12} /> Atualizar</button>
                  </div>
                  <div className="space-y-3">
                    {quests.map(q => (
                      <div key={q.id} onClick={() => completeQuest(q.id)} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${q.completed ? "bg-green-900/10 border-green-900/30 opacity-60" : "bg-gray-800 border-gray-700 hover:bg-gray-750 hover:border-blue-500/50"}`}>
                        <div className="flex items-center space-x-3">
                          {q.completed ? <CheckCircle className="text-green-500" size={20} /> : <Circle className="text-gray-500 group-hover:text-blue-400" size={20} />}
                          <span className={`font-medium ${q.completed ? "line-through text-gray-500" : "text-gray-200"}`}>{q.text}</span>
                        </div>
                        <span className="text-xs font-bold text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">+{q.xp} XP</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 flex flex-col justify-center text-center md:text-left">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-center md:justify-start font-brand"><Flame className="mr-2 text-orange-400" size={20} /> Próximo Passo</h3>
                  {currentFocus ? (
                    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 relative overflow-hidden group hover:border-blue-500 transition-colors cursor-pointer" onClick={() => setSelectedModuleId(currentFocus.id)}>
                      <p className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-2">Módulo {currentFocus.id}</p>
                      <h4 className="text-2xl font-bold text-white mb-3 font-brand">{currentFocus.module}</h4>
                      <p className="text-gray-400 text-sm mb-6 leading-relaxed">{currentFocus.description}</p>
                      <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center font-brand uppercase tracking-wider text-sm shadow-lg shadow-blue-900/20">Começar Aula <ChevronRight size={18} className="ml-2" /></button>
                    </div>
                  ) : (
                    <div className="text-center py-8"><Trophy size={48} className="text-yellow-500 mx-auto mb-4" /><h4 className="text-white font-bold font-brand text-xl">Você zerou o curso!</h4></div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'roadmap' && (
            <div className="relative space-y-8 pb-12">
              <div className="absolute left-6 md:left-1/2 top-4 bottom-0 w-0.5 bg-gray-800 -translate-x-1/2" />
              {roadmap.map((module, index) => {
                const isLeft = index % 2 === 0;
                const isLocked = module.status === 'locked';
                return (
                  <div key={module.id} className={`relative flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className={`absolute left-6 md:left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-4 z-10 flex items-center justify-center bg-gray-900 transition-all ${module.status === 'completed' ? 'border-green-500 text-green-500' : module.status === 'unlocked' ? 'border-blue-500 text-white animate-pulse' : 'border-gray-700 text-gray-600'}`}>
                      {module.status === 'completed' ? <Check size={20} /> : module.status === 'unlocked' ? <Play size={20} fill="currentColor" /> : <Lock size={20} />}
                    </div>
                    <div onClick={() => !isLocked && setSelectedModuleId(module.id)} className={`ml-16 md:ml-0 w-[calc(100%-5rem)] md:w-[calc(50%-3rem)] p-5 rounded-2xl border transition-all duration-300 relative group ${isLeft ? 'md:mr-auto' : 'md:ml-auto'} ${isLocked ? 'bg-gray-900/50 border-gray-800 cursor-not-allowed opacity-60 grayscale' : 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:translate-y-[-4px] cursor-pointer hover:shadow-xl'} ${module.status === 'unlocked' ? 'ring-1 ring-blue-500/30' : ''}`}>
                      <div className="flex justify-between items-start mb-2"><span className={`text-xs font-bold uppercase tracking-wider ${isLocked ? 'text-gray-600' : 'text-blue-400'}`}>Módulo {module.id}</span></div>
                      <h3 className={`font-bold text-lg mb-1 font-brand ${isLocked ? 'text-gray-500' : 'text-white'}`}>{module.module}</h3>
                      <p className="text-sm text-gray-400 mb-4 leading-relaxed">{module.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'mentor' && (
            <div className="h-[600px] flex flex-col bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none shadow-lg' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>{m.text}</div>
                  </div>
                ))}
                {isChatLoading && <div className="text-gray-500 text-xs p-4 animate-pulse">Mentor digitando...</div>}
              </div>
              <div className="p-4 bg-gray-900 border-t border-gray-700 flex gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 text-white focus:outline-none focus:border-blue-500 transition-all placeholder-gray-500" placeholder="Pergunte ao Gemini..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatSend()} />
                <button onClick={handleChatSend} className="bg-blue-600 p-2.5 rounded-lg text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all"><Send size={20} /></button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}