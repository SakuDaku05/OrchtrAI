import React from 'react';
import { motion } from 'framer-motion'; // Updated import to standard framer-motion
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import {
  Brain,
  Search,
  Play,
  ShieldCheck,
  UserCheck,
  Zap,
  Info,
  MessageSquare,
  Sparkles
} from 'lucide-react';

// Removed TypeScript typings for pure JSX compatibility
const AgentProfile = ({ name, role, icon: Icon, color, description, tasks }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col h-full"
  >
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-sm`}>
      <Icon size={28} className="text-white" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-1">{name}</h3>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{role}</p>
    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">{description}</p>
    <div className="space-y-2 mt-auto">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Core Responsibilities</p>
      {tasks.map((task, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-1 h-1 rounded-full bg-slate-300" />
          <span>{task}</span>
        </div>
      ))}
    </div>
  </motion.div>
);

const Team = () => {
  const agents = [
    {
      name: 'The Planner',
      role: 'Strategist',
      icon: Brain,
      color: 'bg-blue-500',
      description: 'The brain of the operation. It takes complex, messy human requests and decomposes them into a structured, logical step-by-step execution plan.',
      tasks: ['Task Decomposition', 'Dependency Mapping', 'Resource Allocation']
    },
    {
      name: 'The Researcher',
      role: 'Context Specialist',
      icon: Search,
      color: 'bg-purple-500',
      description: 'The knowledge gatherer. It digs through internal documents, web data, and databases to ensure the team has all the context needed for accurate output.',
      tasks: ['Data Retrieval', 'Context Synthesis', 'Fact Verification']
    },
    {
      name: 'The Executor',
      role: 'Action Agent',
      icon: Play,
      color: 'bg-amber-500',
      description: 'The hands of the operation. It interacts with external APIs, drafts content, schedules events, and performs the actual work defined in the plan.',
      tasks: ['API Integration', 'Content Drafting', 'Workflow Execution']
    },
    {
      name: 'The Reviewer',
      role: 'Quality Assurance',
      icon: ShieldCheck,
      color: 'bg-emerald-500',
      description: 'The safety net. It sanity checks every output against the original goal to prevent hallucinations and ensure the highest quality before human review.',
      tasks: ['Sanity Checking', 'Format Validation', 'Hallucination Detection']
    },
    {
      name: 'The Finalizer',
      role: 'Communications Expert',
      icon: Sparkles,
      color: 'bg-indigo-500',
      description: 'The presenter. It transforms raw technical outputs and structured data into beautifully formatted, human-readable markdown formats.',
      tasks: ['Data Storytelling', 'Markdown Formatting', 'Table Generation']
    }
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-16 py-8">

            {/* Header Section */}
            {/* <section className="text-center space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4"
              >
                <Zap size={14} className="fill-white" />
                <span>The OrchestrAl Team</span>
              </motion.div>
              <h1 className="text-5xl font-bold tracking-tight text-slate-900">
                Specialized Intelligence, <br/>Working in Harmony.
              </h1>
              <p className="text-slate-500 max-w-2xl mx-auto text-lg mt-4">
                OrchestrAl isn't just one model—it's a team of specialized agents designed to collaborate, 
                critique, and execute complex workflows with human-level precision.
              </p>
            </section> */}

            {/* Agent Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {agents.map((agent, i) => (
                <AgentProfile key={i} {...agent} />
              ))}
            </section>

            {/* Collaboration Loop Section */}
            <section className="bg-white rounded-[40px] border border-slate-200 p-12 shadow-sm overflow-hidden relative">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">The Collaboration Loop</h2>
                    <p className="text-slate-600 leading-relaxed">
                      Our agents don't work in isolation. They communicate through a structured message bus,
                      passing context and feedback until the task is perfected.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {[
                      { step: '01', title: 'Planning', desc: 'The Planner breaks down the goal.' },
                      { step: '02', title: 'Contextualizing', desc: 'The Researcher feeds the plan with data.' },
                      { step: '03', title: 'Execution', desc: 'The Executor performs the actions.' },
                      { step: '04', title: 'Validation', desc: 'The Reviewer checks for errors.' },
                      { step: '05', title: 'Formatting', desc: 'The Finalizer polishes the output.' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <span className="text-2xl font-black text-slate-200 font-mono">{item.step}</span>
                        <div>
                          <h4 className="font-bold text-slate-900">{item.title}</h4>
                          <p className="text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative h-[400px] bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center overflow-hidden hidden lg:flex">
                  {/* Visual representation of the loop */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-transparent to-transparent" />
                  </div>

                  <div className="relative w-64 h-64 border-2 border-dashed border-slate-200 rounded-full flex items-center justify-center animate-[spin_20s_linear_infinite]">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-blue-500 rounded-lg shadow-lg flex items-center justify-center text-white">
                      <Brain size={16} />
                    </div>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-8 h-8 bg-purple-500 rounded-lg shadow-lg flex items-center justify-center text-white">
                      <Search size={16} />
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-amber-500 rounded-lg shadow-lg flex items-center justify-center text-white">
                      <Play size={16} />
                    </div>
                    <div className="absolute top-1/2 -left-4 -translate-y-1/2 w-8 h-8 bg-emerald-500 rounded-lg shadow-lg flex items-center justify-center text-white">
                      <ShieldCheck size={16} />
                    </div>
                  </div>

                  <div className="absolute flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
                      <MessageSquare className="text-slate-900" size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Bus</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Human in the Loop Section */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-black rounded-[40px] p-12 text-white relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    <UserCheck size={12} />
                    <span>Human in the Loop (HITL)</span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">You are the Final Authority.</h2>
                  <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                    Automation shouldn't mean losing control. OrchestrAl includes mandatory validation checkpoints
                    where a human must provide a "thumbs up" before critical actions are finalized.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
                      <h4 className="font-bold mb-2">Validation</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Agents present their findings and proposed actions for your approval.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex-1">
                      <h4 className="font-bold mb-2">Correction</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Redirect the team if the context changes or the plan needs adjustment.</p>
                    </div>
                  </div>
                </div>

                {/* Decorative background element */}
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full" />
              </div>

              <div className="bg-emerald-50 rounded-[40px] p-10 border border-emerald-100 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                    <Info className="text-emerald-600" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Why HITL?</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    By combining AI speed with human judgment, we eliminate the risk of autonomous errors while
                    retaining 90% of the efficiency gains.
                  </p>
                </div>
                <button className="w-full bg-white border border-emerald-200 py-4 rounded-2xl font-bold text-emerald-700 hover:bg-emerald-100 transition-all text-sm mt-8">
                  Learn about Safety
                </button>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Team;