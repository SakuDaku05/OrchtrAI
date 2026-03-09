import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MCPPage = () => {
    const [configs, setConfigs] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newConfig, setNewConfig] = useState({ name: '', service: 'zomato', config: { api_key: '' } });
    const navigate = useNavigate();

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/mcp');
            const data = await res.json();
            setConfigs(data.configs || []);
        } catch (err) {
            console.error("Failed to fetch MCP configs", err);
        }
    };

    const handleSave = async () => {
        try {
            await fetch('http://localhost:8000/api/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            setShowAddModal(false);
            fetchConfigs();
        } catch (err) {
            console.error("Failed to save config", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://localhost:8000/api/mcp/${id}`, { method: 'DELETE' });
            fetchConfigs();
        } catch (err) {
            console.error("Failed to delete config", err);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#0f172a',
            padding: '40px 20px'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                    <div>
                        <button
                            onClick={() => navigate('/app')}
                            style={{
                                background: 'none', border: 'none', color: '#475569',
                                cursor: 'pointer', fontSize: '14px', marginBottom: '10px',
                                display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                        >
                            ← Back to Chat
                        </button>
                        <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.02em' }}>MCP Connectors</h1>
                        <p style={{ color: '#475569', marginTop: '5px' }}>Manage your Model Context Protocol service integrations.</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        style={{
                            backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 24px',
                            borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    >
                        + Connect New
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {configs.map(cfg => (
                        <div key={cfg.id} style={{
                            padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0',
                            backgroundColor: '#f8fafc', position: 'relative'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    backgroundColor: '#0f172a', color: '#fff', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }}>
                                    {cfg.service[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: '700' }}>{cfg.name}</h3>
                                    <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>{cfg.service}</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#475569' }}>
                                Status: <span style={{ color: '#10b981', fontWeight: '600' }}>Active</span>
                            </div>
                            <button
                                onClick={() => handleDelete(cfg.id)}
                                style={{
                                    position: 'absolute', top: '24px', right: '24px',
                                    background: 'none', border: 'none', color: '#ef4444',
                                    cursor: 'pointer', fontSize: '12px'
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    {configs.length === 0 && (
                        <div style={{
                            gridColumn: '1/-1', textAlign: 'center', padding: '60px',
                            border: '2px dashed #e2e8f0', borderRadius: '16px', color: '#64748b'
                        }}>
                            No connectors configured yet. Click "Connect New" to start.
                        </div>
                    )}
                </div>
            </div>

            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px',
                        width: '100%', maxWidth: '500px', border: '1px solid #e2e8f0',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                    }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Connect MCP Service</h2>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Name</label>
                            <input
                                type="text"
                                value={newConfig.name}
                                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                                placeholder="My Zomato Connector"
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Service Type</label>
                            <select
                                value={newConfig.service}
                                onChange={(e) => setNewConfig({ ...newConfig, service: e.target.value })}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="zomato">Zomato (Restaurant Search)</option>
                                <option value="github">GitHub (Repository Management)</option>
                                <option value="spotify">Spotify (Playlists & Music)</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>API Key</label>
                            <input
                                type="password"
                                value={newConfig.config.api_key}
                                onChange={(e) => setNewConfig({ ...newConfig, config: { ...newConfig.config, api_key: e.target.value } })}
                                placeholder="sk-..."
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'none', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MCPPage;
