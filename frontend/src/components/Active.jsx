import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Brain, Search, Play, ShieldCheck, ArrowRight, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

const AgentNode = ({ name, icon: Icon, status, description, delay = 0 }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'thinking': return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'working': return 'border-emerald-500 bg-emerald-50 text-emerald-700';
      case 'completed': return 'border-emerald-200 bg-white text-emerald-600';
      case 'error': return 'border-red-500 bg-red-50 text-red-700';
      default: return 'border-slate-200 bg-white text-slate-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 flex-1 h-full transition-all duration-500 ${getStatusColor()} ${status === 'thinking' || status === 'working' ? 'shadow-lg scale-105' : 'shadow-sm'
        }`}
    >
      <div className={`p-3 rounded-xl mb-4 ${status === 'idle' ? 'bg-slate-100' : 'bg-white'}`}>
        {status === 'thinking' || status === 'working' ? (
          <Loader2 className="animate-spin text-current" size={32} />
        ) : status === 'completed' ? (
          <CheckCircle2 size={32} className="text-emerald-500" />
        ) : (
          <Icon size={32} className="text-current" />
        )}
      </div>
      <h3 className="font-bold text-lg mb-1 text-center">{name}</h3>
      <p className="text-sm text-center opacity-70 leading-tight">{description}</p>

      {status === 'thinking' && (
        <motion.div
          layoutId="active-glow"
          className="absolute -inset-1 rounded-2xl bg-blue-400/20 blur-md -z-10"
        />
      )}
    </motion.div>
  );
};

const Active = ({ activeStep = -1 }) => {
  const agents = [
    { id: 'planner', name: 'The Planner', icon: Brain, description: 'Decomposing request into subtasks' },
    { id: 'researcher', name: 'The Researcher', icon: Search, description: 'Gathering context and data' },
    { id: 'executor', name: 'The Executor', icon: Play, description: 'Performing API actions' },
    { id: 'reviewer', name: 'The Reviewer', icon: ShieldCheck, description: 'Validating final output' },
    { id: 'finalizer', name: 'The Finalizer', icon: Sparkles, description: 'Formatting final response' },
  ];

  const getStatus = (index) => {
    if (activeStep === -1) return 'idle';
    if (activeStep === index) return 'thinking';
    if (activeStep > index) return 'completed';
    return 'idle';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 w-full flex flex-col min-h-[450px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gray-100 p-2 rounded-lg">
          <Zap size={20} className="text-gray-700" />
        </div>
        <div>
          <h2 className="font-bold text-lg text-slate-900">Active Orchestration</h2>
          <p className="text-sm text-gray-500">Real-time agent communication flow</p>
        </div>
      </div>

      <div className="flex items-center justify-between w-full gap-4 flex-1 relative mt-4">
        {/* Connection Lines Background */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 -z-10" />

        {agents.map((agent, index) => (
          <React.Fragment key={agent.id}>
            <AgentNode
              {...agent}
              status={getStatus(index)}
              delay={index * 0.1}
            />
            {index < agents.length - 1 && (
              <div className="flex-shrink-0 flex justify-center px-2">
                <motion.div
                  animate={{
                    opacity: activeStep > index ? 1 : 0.3,
                    scale: activeStep === index ? [1, 1.2, 1] : 1
                  }}
                  transition={{ repeat: activeStep === index ? Infinity : 0, duration: 1.5 }}
                >
                  <ArrowRight className={activeStep > index ? "text-emerald-400" : "text-slate-300"} size={32} />
                </motion.div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default Active;