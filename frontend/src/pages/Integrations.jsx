import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Blocks, Plus, Trash2, Power, PowerOff, Zap, Settings2 } from 'lucide-react';
import { getMcpConfigs, saveMcpConfig, deleteMcpConfig } from '../lib/api';
import { toast } from 'react-hot-toast';

const Integrations = () => {
    const [configs, setConfigs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newService, setNewService] = useState('spotify');
    const [newName, setNewName] = useState('Spotify Music');
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setIsLoading(true);
        try {
            const data = await getMcpConfigs();
            setConfigs(data);
        } catch (error) {
            toast.error('Failed to load integrations');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleState = async (config) => {
        try {
            const updatedConfig = { ...config, is_active: !config.is_active };
            await saveMcpConfig(updatedConfig);
            toast.success(`${updatedConfig.name} ${updatedConfig.is_active ? 'enabled' : 'disabled'}`);
            setConfigs(configs.map(c => c.id === config.id ? updatedConfig : c));
        } catch (error) {
            toast.error('Failed to update integration state');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMcpConfig(id);
            toast.success('Integration removed');
            setConfigs(configs.filter(c => c.id !== id));
        } catch (error) {
            toast.error('Failed to remove integration');
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!clientId.trim() || !clientSecret.trim()) {
            toast.error('Please fill out all fields');
            return;
        }

        try {
            const configData = {
                name: newName,
                service: newService,
                is_active: true,
                config: {
                    client_id: clientId,
                    client_secret: clientSecret
                }
            };
            const savedConfig = await saveMcpConfig(configData);
            setConfigs([...configs, savedConfig]);
            toast.success('Integration added successfully!');
            setIsAdding(false);
            setClientId('');
            setClientSecret('');
        } catch (error) {
            toast.error('Failed to add integration');
            console.error(error);
        }
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-5xl mx-auto space-y-10 py-4">

                        <div className="flex items-center justify-between bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <div className="flex items-start gap-5">
                                <div className="bg-black text-white p-3 rounded-xl shadow-sm mt-1">
                                    <Blocks size={28} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
                                        Model Context Protocol
                                    </h1>
                                    <p className="text-slate-500 max-w-xl leading-relaxed">
                                        Connect OrchestrAl to external services using MCP servers. Activated integrations are automatically exposed as tools during agent orchestrations.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAdding(!isAdding)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors shadow-sm ${
                                    isAdding 
                                    ? 'bg-gray-100 text-slate-700 hover:bg-gray-200 border border-gray-200' 
                                    : 'bg-black text-white hover:bg-gray-800'
                                }`}
                            >
                                {isAdding ? 'Cancel' : <><Plus size={18} /> Add Integration</>}
                            </button>
                        </div>

                        {isAdding && (
                            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-4">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                                    <div className="bg-gray-100 p-2 rounded-lg text-gray-700">
                                        <Settings2 size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">Configure New Service</h3>
                                </div>
                                
                                <form onSubmit={handleAddSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Service Type</label>
                                            <select
                                                value={newService}
                                                onChange={(e) => {
                                                    setNewService(e.target.value);
                                                    if (e.target.value === 'spotify') setNewName('Spotify Music');
                                                    else setNewName('Custom Integration');
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors appearance-none bg-white"
                                            >
                                                <option value="spotify">Spotify</option>
                                                <option value="custom">Custom (Coming soon)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Display Name</label>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                                                placeholder="e.g. Spotify Main Account"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Client ID</label>
                                            <input
                                                type="text"
                                                value={clientId}
                                                onChange={(e) => setClientId(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors font-mono text-sm"
                                                placeholder="Enter Client ID from developer portal"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-slate-700">Client Secret</label>
                                            <input
                                                type="password"
                                                value={clientSecret}
                                                onChange={(e) => setClientSecret(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors font-mono text-sm"
                                                placeholder="Enter Client Secret"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end">
                                        <button type="submit" className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-sm">
                                            <Plus size={18} />
                                            Connect Integration
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 w-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <Zap size={20} className="text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg text-slate-900">Active Integrations</h2>
                                    <p className="text-sm text-gray-500">Manage your connected MCP servers</p>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="py-12 text-center text-slate-400 font-mono text-sm animate-pulse">Loading configurations...</div>
                            ) : configs.length === 0 ? (
                                <div className="bg-gray-50 rounded-2xl min-h-[200px] border-2 border-dashed border-gray-200 flex items-center justify-center flex-col text-slate-400">
                                    <Blocks size={40} className="mb-4 text-gray-300" />
                                    <p className="font-medium text-slate-500">No MCP integrations configured yet.</p>
                                    <p className="text-sm mt-1">Click "Add Integration" to connect a service.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {configs.map(config => (
                                        <div key={config.id} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 transition-all hover:border-gray-300 hover:shadow-md flex flex-col relative overflow-hidden group">
                                            <div className="flex items-center justify-between mb-6 z-10">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 ${config.service === 'spotify' ? 'bg-[#1DB954]' : 'bg-black'}`}>
                                                        {config.service === 'spotify' ? (
                                                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.24 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                                                        ) : (
                                                            <Blocks className="text-white" size={24} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 text-base">{config.name}</h3>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-0.5">{config.service} MCP</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleToggleState(config)}
                                                    className={`w-12 h-7 rounded-full transition-colors relative flex items-center border ${config.is_active ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300'}`}
                                                >
                                                    <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-sm absolute ${config.is_active ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
                                                </button>
                                            </div>

                                            <div className="flex-1 mb-6">
                                                <p className="text-xs text-slate-500 font-mono bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-100 inline-block">
                                                    ID: {config.id.split('-')[1]} •••• {config.id.split('-').pop().slice(-4)}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 z-10">
                                                <span className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 ${config.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                                    {config.is_active ? <Power size={12} /> : <PowerOff size={12} />}
                                                    {config.is_active ? 'Ready for Use' : 'Disconnected'}
                                                </span>

                                                <button
                                                    onClick={() => handleDelete(config.id)}
                                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Remove Integration"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Integrations;