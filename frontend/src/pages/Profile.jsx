import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import { getProfile, updateProfile } from '../lib/api';
import {
  User, Mail, GraduationCap, Github,
  Link as LinkIcon, FileText, Wrench,
  Camera, X, Save, Loader2,
} from 'lucide-react';

const EMPTY_FORM = {
  full_name: '',
  email: '',
  college_email: '',
  github_username: '',
  github_url: '',
  bio: '',
};

const Profile = () => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          college_email: data.college_email || '',
          github_username: data.github_username || '',
          github_url: data.github_url || '',
          bio: data.bio || '',
        });
        setSkills(data.skills || []);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(`Failed to load profile: ${err.message}`);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim() !== '') {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ ...formData, skills, user_id: 'default_user' });
      toast.success('Profile saved successfully!');
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f8fafc] font-sans">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-gray-400 gap-3">
          <Loader2 size={28} className="animate-spin" />
          <span>Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Toaster position="top-right" />
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="w-full max-w-4xl mx-auto">

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                      <User size={48} strokeWidth={1.5} />
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full text-slate-700 hover:text-black hover:border-black transition-colors shadow-sm">
                      <Camera size={16} />
                    </button>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{formData.full_name || 'Your Name'}</h1>
                    <p className="text-gray-500 font-medium">@{formData.github_username || 'github-handle'}</p>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium shadow-sm disabled:opacity-60"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <User size={16} className="text-gray-400" /> Full Name
                    </label>
                    <input
                      type="text" name="full_name" value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Mail size={16} className="text-gray-400" /> Email Address
                      </label>
                      <span className="text-xs text-gray-400 font-medium">(Read-only)</span>
                    </div>
                    <input
                      type="email" value={formData.email} readOnly
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <GraduationCap size={16} className="text-gray-400" /> College Email
                      </label>
                      <span className="text-xs text-gray-400 font-medium">(Read-only)</span>
                    </div>
                    <input
                      type="email" value={formData.college_email} readOnly
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 focus:outline-none cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <Github size={16} className="text-gray-400" /> GitHub Username
                    </label>
                    <input
                      type="text" name="github_username" value={formData.github_username}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <LinkIcon size={16} className="text-gray-400" /> GitHub Profile URL
                  </label>
                  <input
                    type="url" name="github_url" value={formData.github_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <FileText size={16} className="text-gray-400" /> Bio
                  </label>
                  <textarea
                    name="bio" value={formData.bio} onChange={handleChange} rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Wrench size={16} className="text-gray-400" /> Skills
                  </label>
                  <div className="w-full min-h-[52px] px-4 py-2 rounded-xl border border-gray-300 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-colors flex flex-wrap items-center gap-2 bg-white">
                    {skills.map((skill, i) => (
                      <span key={i} className="flex items-center gap-1 bg-gray-100 text-slate-800 border border-gray-200 px-3 py-1 rounded-lg text-sm font-medium">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="text-gray-400 hover:text-black transition-colors ml-1 focus:outline-none">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text" value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Type a skill and press Enter"
                      className="flex-1 min-w-[200px] outline-none text-slate-700 bg-transparent py-1"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;