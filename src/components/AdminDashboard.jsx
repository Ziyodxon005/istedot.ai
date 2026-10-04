import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, School, Users, ClipboardList, MessageCircle, Plus, Trash2, Eye, EyeOff, BarChart3, Award, LogOut, ChevronDown, ChevronUp, TrendingUp, Percent, Search, Edit3, Save, X, PenLine } from 'lucide-react';
import { getAllResults, getResultsBySchool, getSchools, addSchool, deleteSchool, updateSchool } from '../services/firebase';
import istedotLogo from '../assets/logo_istedot.png';

const handleCardTilt = (e) => {
    const card = e.currentTarget;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -6;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
};
const handleCardReset = (e) => { e.currentTarget.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)'; };

const CircleProgress = ({ value, max, color, label, icon }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    return (
        <div className="circle-stat" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
            <svg className="circle-svg" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={radius} className="circle-bg" />
                <motion.circle cx="45" cy="45" r={radius} className="circle-fill" style={{ stroke: color, strokeDasharray: circumference, strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: 'easeOut' }} />
            </svg>
            <div className="circle-inner"><span className="circle-value">{value}</span><span className="circle-pct" style={{ color }}>{pct}%</span></div>
            <div className="circle-label">{icon}<span>{label}</span></div>
        </div>
    );
};

const ProgressBar = ({ value, max, color, label }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="progress-row">
            <div className="progress-row-info"><span className="progress-row-label">{label}</span><span className="progress-row-val" style={{ color }}>{value} <small>({pct}%)</small></span></div>
            <div className="progress-bar-track"><motion.div className="progress-bar-fill" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} /></div>
        </div>
    );
};

const AdminDashboard = ({ adminData, onLogout, onViewCert }) => {
    const { role, school } = adminData;
    const isSuperAdmin = role === 'super';

    const [results, setResults] = useState([]);
    const [schools, setSchools] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats');

    // Add school
    const [newSchool, setNewSchool] = useState({ name: '', directorName: '', directorSurname: '', password: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [addingSchool, setAddingSchool] = useState(false);
    const [addSuccess, setAddSuccess] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [expandedSchool, setExpandedSchool] = useState(null);

    // Edit school
    const [editingSchoolId, setEditingSchoolId] = useState(null);
    const [editData, setEditData] = useState({ name: '', directorName: '', directorSurname: '', password: '' });
    const [showEditPassword, setShowEditPassword] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterSchool, setFilterSchool] = useState('all');
    const [filterGrade, setFilterGrade] = useState('all');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (isSuperAdmin) {
                const [allResults, allSchools] = await Promise.all([getAllResults(1000), getSchools()]);
                setResults(allResults);
                setSchools(allSchools);
            } else {
                const schoolResults = await getResultsBySchool(school.name);
                setResults(schoolResults);
            }
        } catch (err) { console.error(err); }
        setIsLoading(false);
    };

    const handleAddSchool = async () => {
        if (!newSchool.name.trim() || !newSchool.directorName.trim() || !newSchool.password.trim()) return;
        setAddingSchool(true);
        await addSchool(newSchool);
        setNewSchool({ name: '', directorName: '', directorSurname: '', password: '' });
        setAddSuccess('✅ Maktab qo\'shildi!');
        setTimeout(() => setAddSuccess(''), 3000);
        await loadData();
        setAddingSchool(false);
    };

    const handleDeleteSchool = async (id) => { await deleteSchool(id); setConfirmDeleteId(null); await loadData(); };

    const startEdit = (s) => {
        setEditingSchoolId(s.id);
        setEditData({ name: s.name, directorName: s.directorName, directorSurname: s.directorSurname, password: s.password });
    };

    const handleSaveEdit = async () => {
        if (!editData.name.trim() || !editData.password.trim()) return;
        await updateSchool(editingSchoolId, editData);
        setEditingSchoolId(null);
        await loadData();
    };

    // Statistikalar
    const totalResults = results.length;
    const testResults = results.filter(r => r.type === 'test');
    const convResults = results.filter(r => r.type === 'conversation');
    const now = Date.now();
    const last7Days = results.filter(r => (now - (r.timestamp || 0)) < 7 * 24 * 60 * 60 * 1000);

    const schoolStats = {};
    results.forEach(r => {
        const s = (r.userInfo?.school || 'Noma\'lum').trim();
        if (!schoolStats[s]) schoolStats[s] = { total: 0, test: 0, conversation: 0, results: [] };
        schoolStats[s].total++;
        schoolStats[s][r.type || 'conversation']++;
        schoolStats[s].results.push(r);
    });
    const sortedSchools = Object.entries(schoolStats).sort((a, b) => b[1].total - a[1].total);

    // Sinf bo'yicha statistika
    const gradeStats = {};
    results.forEach(r => {
        const g = (r.userInfo?.grade || r.grade || '').trim();
        if (!g) return;
        if (!gradeStats[g]) gradeStats[g] = { total: 0, test: 0, conversation: 0 };
        gradeStats[g].total++;
        gradeStats[g][r.type || 'conversation']++;
    });
    const sortedGrades = Object.entries(gradeStats).sort((a, b) => {
        const numA = parseInt(a[0]) || 0;
        const numB = parseInt(b[0]) || 0;
        return numA - numB;
    });

    // Filtrlangan natijalar
    const filteredResults = results.filter(r => {
        const matchSchool = filterSchool === 'all' || (r.userInfo?.school || '').toLowerCase().trim() === filterSchool.toLowerCase().trim();
        const matchGrade = filterGrade === 'all' || (r.userInfo?.grade || r.grade || '').trim() === filterGrade;
        const q = searchQuery.toLowerCase().trim();
        const matchSearch = !q || (r.userInfo?.name || '').toLowerCase().includes(q) || (r.userInfo?.surname || '').toLowerCase().includes(q);
        return matchSchool && matchGrade && matchSearch;
    });

    // Unique names
    const schoolNames = [...new Set(results.map(r => (r.userInfo?.school || '').trim()).filter(Boolean))];
    const gradeNames = [...new Set(results.map(r => (r.userInfo?.grade || r.grade || '').trim()).filter(Boolean))].sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));

    return (
        <motion.div className="admin-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="admin-orbs"><div className="admin-orb admin-orb-1" /><div className="admin-orb admin-orb-2" /><div className="admin-orb admin-orb-3" /></div>

            <header className="admin-header">
                <div className="admin-header-center">
                    <img src={istedotLogo} alt="" className="admin-header-logo" />
                    <div>
                        <h1 className="admin-header-title">{isSuperAdmin ? 'Super Admin' : school?.name || 'Admin'}</h1>
                        <span className="admin-header-role">{isSuperAdmin ? '🛡️ To\'liq boshqaruv' : `📚 ${school?.directorName} ${school?.directorSurname}`}</span>
                    </div>
                </div>
                <div className="admin-header-actions">
                    <motion.button className="admin-logout-btn" onClick={onLogout} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <LogOut size={14} /><span>Chiqish</span>
                    </motion.button>
                    <div className={`admin-role-badge ${isSuperAdmin ? 'super' : 'school'}`}><Shield size={12} /><span>{isSuperAdmin ? 'SUPER' : 'ADMIN'}</span></div>
                </div>
            </header>

            <div className="admin-tabs">
                <button className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}><BarChart3 size={15} /><span>Statistika</span></button>
                {isSuperAdmin && <button className={`admin-tab ${activeTab === 'schools' ? 'active' : ''}`} onClick={() => setActiveTab('schools')}><School size={15} /><span>Maktablar</span></button>}
                <button className={`admin-tab ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}><Award size={15} /><span>Natijalar</span></button>
            </div>

            <div className="admin-content">
                {isLoading ? (
                    <div className="admin-loading"><img src={istedotLogo} alt="" className="test-loading-logo" /><p>Yuklanmoqda...</p></div>
                ) : (
                    <>
                        {/* ════ STATISTIKA ════ */}
                        {activeTab === 'stats' && (
                            <motion.div className="admin-stats" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="admin-big-stats-row">
                                    <div className="big-stat-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}><Users size={20} className="text-cyan" /><span className="big-stat-num">{totalResults}</span><span className="big-stat-label">Jami natijalar</span></div>
                                    {isSuperAdmin && <div className="big-stat-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}><School size={20} style={{ color: '#8b5cf6' }} /><span className="big-stat-num">{Object.keys(schoolStats).length}</span><span className="big-stat-label">Maktablar soni</span></div>}
                                    <div className="big-stat-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}><ClipboardList size={20} style={{ color: '#22c55e' }} /><span className="big-stat-num">{sortedGrades.length}</span><span className="big-stat-label">Sinflar soni</span></div>
                                    <div className="big-stat-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}><TrendingUp size={20} style={{ color: '#ffa500' }} /><span className="big-stat-num">{last7Days.length}</span><span className="big-stat-label">Oxirgi 7 kun</span></div>
                                    {!isSuperAdmin && <div className="big-stat-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}><Percent size={20} style={{ color: '#ffa500' }} /><span className="big-stat-num">{totalResults > 0 ? Math.round((testResults.length / totalResults) * 100) : 0}%</span><span className="big-stat-label">Test ulushi</span></div>}
                                </div>

                                <div className="admin-overview-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
                                    <div className="overview-header"><h3><BarChart3 size={16} className="text-cyan" /> Test va Suhbat taqqoslash</h3></div>
                                    <div className="overview-bars">
                                        <ProgressBar value={testResults.length} max={totalResults || 1} color="#8b5cf6" label="📝 Test natijalari" />
                                        <ProgressBar value={convResults.length} max={totalResults || 1} color="#22c55e" label="🎙️ Suhbat natijalari" />
                                    </div>
                                </div>

                                {/* Sinflar bo'yicha statistika */}
                                {sortedGrades.length > 0 && (
                                    <div className="admin-overview-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
                                        <div className="overview-header"><h3><ClipboardList size={16} className="text-cyan" /> Sinflar bo'yicha statistika</h3></div>
                                        <div className="circle-stats-row">
                                            {sortedGrades.slice(0, 6).map(([name, stats], idx) => (
                                                <CircleProgress key={name} value={stats.total} max={sortedGrades[0][1].total || 1}
                                                    color={['#4db8ff', '#8b5cf6', '#22c55e', '#ffa500', '#ef4444', '#ec4899'][idx % 6]}
                                                    label={name} icon={<PenLine size={12} />} />
                                            ))}
                                        </div>
                                        <div className="overview-bars" style={{ marginTop: 16 }}>
                                            {sortedGrades.map(([name, stats], idx) => (
                                                <ProgressBar key={name} value={stats.total} max={totalResults || 1}
                                                    color={`hsl(${(idx * 30 + 200) % 360}, 70%, 55%)`} label={`📚 ${name}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isSuperAdmin && sortedSchools.length > 0 && (
                                    <div className="admin-overview-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
                                        <div className="overview-header"><h3><School size={16} className="text-cyan" /> Maktablar solishtirmasi</h3></div>
                                        <div className="circle-stats-row">
                                            {sortedSchools.slice(0, 4).map(([name, stats], idx) => (
                                                <CircleProgress key={name} value={stats.total} max={sortedSchools[0][1].total || 1}
                                                    color={['#4db8ff', '#8b5cf6', '#22c55e', '#ffa500'][idx] || '#4db8ff'}
                                                    label={name.length > 14 ? name.slice(0, 14) + '…' : name} icon={<School size={12} />} />
                                            ))}
                                        </div>
                                        <div className="overview-bars" style={{ marginTop: 16 }}>
                                            {sortedSchools.map(([name, stats], idx) => (
                                                <ProgressBar key={name} value={stats.total} max={totalResults || 1}
                                                    color={`hsl(${(idx * 60 + 200) % 360}, 70%, 55%)`} label={`🏫 ${name}`} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="admin-ranking-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
                                    <h3 className="ranking-title"><School size={16} className="text-cyan" /> {isSuperAdmin ? 'Maktablar reytingi' : `${school?.name} tafsilotlari`}</h3>
                                    {sortedSchools.length === 0 ? <p className="admin-empty-text">Natijalar mavjud emas</p> : (
                                        <div className="ranking-list">
                                            {sortedSchools.map(([name, stats], idx) => (
                                                <motion.div key={name} className={`ranking-item ${expandedSchool === name ? 'expanded' : ''}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                                    <div className="ranking-row" onClick={() => setExpandedSchool(expandedSchool === name ? null : name)}>
                                                        <div className="ranking-left"><span className="ranking-pos">{idx + 1}</span><span className="ranking-name">{name}</span></div>
                                                        <div className="ranking-right">
                                                            <div className="ranking-mini-bars"><span className="ranking-mini test" style={{ width: `${Math.max(4, (stats.test / (sortedSchools[0][1].total || 1)) * 80)}px` }} /><span className="ranking-mini conv" style={{ width: `${Math.max(4, (stats.conversation / (sortedSchools[0][1].total || 1)) * 80)}px` }} /></div>
                                                            <span className="ranking-count">{stats.total}</span>
                                                            <span className="ranking-pct">{Math.round((stats.total / (totalResults || 1)) * 100)}%</span>
                                                            {expandedSchool === name ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                        </div>
                                                    </div>
                                                    <AnimatePresence>
                                                        {expandedSchool === name && (
                                                            <motion.div className="ranking-details" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                                <div className="ranking-detail-bars">
                                                                    <ProgressBar value={stats.test} max={stats.total || 1} color="#8b5cf6" label="Test" />
                                                                    <ProgressBar value={stats.conversation} max={stats.total || 1} color="#22c55e" label="Suhbat" />
                                                                </div>
                                                                <div className="ranking-recent">
                                                                    {stats.results.slice(0, 5).map((r, i) => (
                                                                        <div key={i} className="ranking-recent-row">
                                                                            <span className={`rr-dot ${r.type}`} /><span className="rr-name">{r.userInfo?.name} {r.userInfo?.surname}</span>
                                                                            <span className="rr-career">{r.analysisData?.recommendedCareers?.[0]?.name || '—'}</span>
                                                                            <span className="rr-date">{new Date(r.timestamp).toLocaleDateString('uz')}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ════ MAKTABLAR ════ */}
                        {activeTab === 'schools' && isSuperAdmin && (
                            <motion.div className="admin-schools-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="admin-add-school-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset}>
                                    <h3 className="admin-section-title"><Plus size={16} className="text-cyan" /> Yangi maktab qo'shish</h3>
                                    <div className="admin-add-form">
                                        <input className="admin-premium-input" placeholder="Maktab nomi" value={newSchool.name} onChange={e => setNewSchool(p => ({ ...p, name: e.target.value }))} />
                                        <div className="admin-add-row two-col">
                                            <input className="admin-premium-input" placeholder="Direktor ismi" value={newSchool.directorName} onChange={e => setNewSchool(p => ({ ...p, directorName: e.target.value }))} />
                                            <input className="admin-premium-input" placeholder="Direktor familyasi" value={newSchool.directorSurname} onChange={e => setNewSchool(p => ({ ...p, directorSurname: e.target.value }))} />
                                        </div>
                                        <div className="admin-password-wrap">
                                            <input className="admin-premium-input admin-password-input" type={showNewPassword ? 'text' : 'password'} placeholder="Parolni belgilang..." value={newSchool.password} onChange={e => setNewSchool(p => ({ ...p, password: e.target.value }))} autoComplete="new-password" name="school-new-pass" />
                                            <button className="admin-eye-btn" onClick={() => setShowNewPassword(!showNewPassword)} type="button">{showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                        </div>
                                        <motion.button className="admin-add-btn" onClick={handleAddSchool} disabled={addingSchool || !newSchool.name.trim() || !newSchool.password.trim()} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                            <Plus size={16} /><span>{addingSchool ? 'Qo\'shilmoqda...' : 'Maktab qo\'shish'}</span>
                                        </motion.button>
                                        {addSuccess && <motion.p className="admin-success-msg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{addSuccess}</motion.p>}
                                    </div>
                                </div>

                                <h3 className="admin-section-title" style={{ marginTop: 32 }}><School size={16} className="text-cyan" /> Mavjud maktablar ({schools.length})</h3>
                                <div className="admin-schools-grid">
                                    {schools.map(s => {
                                        const cnt = results.filter(r => (r.userInfo?.school || '').toLowerCase().trim() === s.name.toLowerCase().trim()).length;
                                        const isEditing = editingSchoolId === s.id;
                                        return (
                                            <motion.div key={s.id} className="admin-school-card" onMouseMove={!isEditing ? handleCardTilt : undefined} onMouseLeave={!isEditing ? handleCardReset : undefined} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                {isEditing ? (
                                                    <div className="school-edit-form">
                                                        <input className="admin-premium-input" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} placeholder="Maktab nomi" />
                                                        <div className="admin-add-row two-col">
                                                            <input className="admin-premium-input" value={editData.directorName} onChange={e => setEditData(p => ({ ...p, directorName: e.target.value }))} placeholder="Ism" />
                                                            <input className="admin-premium-input" value={editData.directorSurname} onChange={e => setEditData(p => ({ ...p, directorSurname: e.target.value }))} placeholder="Familya" />
                                                        </div>
                                                        <div className="admin-password-wrap">
                                                            <input className="admin-premium-input admin-password-input" type={showEditPassword ? 'text' : 'password'} value={editData.password} onChange={e => setEditData(p => ({ ...p, password: e.target.value }))} placeholder="Parol" />
                                                            <button className="admin-eye-btn" onClick={() => setShowEditPassword(!showEditPassword)} type="button">{showEditPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                                        </div>
                                                        <div className="school-edit-actions">
                                                            <motion.button className="school-save-btn" onClick={handleSaveEdit} whileTap={{ scale: 0.95 }}><Save size={14} /><span>Saqlash</span></motion.button>
                                                            <motion.button className="school-cancel-btn" onClick={() => setEditingSchoolId(null)} whileTap={{ scale: 0.95 }}><X size={14} /><span>Bekor</span></motion.button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="school-card-top"><School size={18} className="text-cyan" /><h4 className="school-card-name">{s.name}</h4></div>
                                                        <div className="school-card-info"><span>👤 {s.directorName} {s.directorSurname}</span><span>📊 {cnt} ta natija</span></div>
                                                        <div className="school-card-actions">
                                                            <button className="school-edit-btn" onClick={() => startEdit(s)}><Edit3 size={14} /></button>
                                                            {confirmDeleteId === s.id ? (
                                                                <div className="school-card-confirm">
                                                                    <span>O'chirilsinmi?</span>
                                                                    <button className="school-confirm-yes" onClick={() => handleDeleteSchool(s.id)}>Ha</button>
                                                                    <button className="school-confirm-no" onClick={() => setConfirmDeleteId(null)}>Yo'q</button>
                                                                </div>
                                                            ) : (
                                                                <button className="school-delete-btn" onClick={() => setConfirmDeleteId(s.id)}><Trash2 size={14} /></button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* ════ NATIJALAR ════ */}
                        {activeTab === 'results' && (
                            <motion.div className="admin-results-tab" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                                {/* Qidirish va Filtr */}
                                <div className="admin-filter-bar">
                                    <div className="admin-search-wrap">
                                        <Search size={15} className="admin-search-icon" />
                                        <input className="admin-premium-input admin-search-input" placeholder="Ism yoki familya qidirish..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                    </div>
                                    {isSuperAdmin && (
                                        <div className="admin-filter-select-wrap">
                                            <School size={14} className="admin-filter-icon" />
                                            <select className="admin-premium-input admin-filter-select" value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
                                                <option value="all">Barcha maktablar</option>
                                                {schoolNames.map(name => <option key={name} value={name}>{name}</option>)}
                                            </select>
                                            <ChevronDown size={14} className="admin-filter-arrow" />
                                        </div>
                                    )}
                                    <div className="admin-filter-select-wrap">
                                        <PenLine size={14} className="admin-filter-icon" />
                                        <select className="admin-premium-input admin-filter-select" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                                            <option value="all">Barcha sinflar</option>
                                            {gradeNames.map(name => <option key={name} value={name}>{name}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="admin-filter-arrow" />
                                    </div>
                                </div>

                                <h3 className="admin-section-title"><Award size={16} className="text-cyan" /> Natijalar ({filteredResults.length})</h3>
                                {filteredResults.length === 0 ? (
                                    <p className="admin-empty-text">Natijalar topilmadi</p>
                                ) : (
                                    <div className="admin-results-grid">
                                        {filteredResults.slice(0, 60).map((r, i) => (
                                            <motion.div key={i} className="admin-result-grid-card" onMouseMove={handleCardTilt} onMouseLeave={handleCardReset} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}>
                                                <div className={`result-grid-type ${r.type}`}>{r.type === 'test' ? '📝' : '🎙️'}</div>
                                                <span className="result-grid-name">{r.userInfo?.name} {r.userInfo?.surname}</span>
                                                <span className="result-grid-school">
                                                    {isSuperAdmin
                                                        ? `${r.userInfo?.school || ''} / ${r.userInfo?.grade || r.grade || ''}`
                                                        : r.userInfo?.grade || r.grade || ''}
                                                </span>
                                                <span className="result-grid-date">{new Date(r.timestamp).toLocaleDateString('uz')}</span>
                                                {r.analysisData && (
                                                    <motion.button className="result-grid-view-btn" onClick={() => onViewCert && onViewCert({ ...r.analysisData, _userInfo: r.userInfo, _testMode: r.type === 'test' })} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                                                        <Eye size={13} /><span>Ko'rish</span>
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
