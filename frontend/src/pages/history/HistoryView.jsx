import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, Filter, Calendar, Star, LayoutGrid, List as ListIcon, 
  GitCommit, Clock, MessageSquare, Sparkles, BrainCircuit, GitGraph, 
  FileSignature, Bookmark, ExternalLink, Copy, Share2, Trash2, ChevronDown,
  FileText
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Navigation';
import { EmptyState } from '../../components/ai/AIStates';
import './HistoryView.css';

export default function HistoryView() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Read search query from URL (from SearchBar navigation)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);
  
  const tabs = ['All', 'Chats', 'Answers', 'MCQs', 'Question Papers', 'Diagrams', 'Bookmarks'];

  // Mock History Data
  const historyData = [
    { id: 1, type: 'Chat', title: 'Understanding Virtual Memory', pdf: 'Operating Systems Chapter 4.pdf', date: '2 hours ago', group: 'Today', icon: MessageSquare, color: '#3b82f6' },
    { id: 2, type: 'Answer', title: 'Difference between B-Tree and BST', pdf: 'Data Structures and Algorithms.pdf', date: '5 hours ago', group: 'Today', icon: Sparkles, color: '#8b5cf6' },
    { id: 3, type: 'Diagram', title: 'OSI Model Network Layers', pdf: 'Computer Networks.pdf', date: 'Yesterday', group: 'Yesterday', icon: GitGraph, color: '#10b981' },
    { id: 4, type: 'MCQ', title: 'Trees and Graphs Assessment', pdf: 'Data Structures and Algorithms.pdf', date: 'Yesterday', group: 'Yesterday', icon: BrainCircuit, color: '#f59e0b' },
    { id: 5, type: 'Question Paper', title: 'Mid-Term Exam - OS', pdf: 'Operating Systems Chapter 4.pdf', date: 'Oct 12, 2026', group: 'Older', icon: FileSignature, color: '#ec4899' },
  ];

  // Filtering Logic
  const filteredData = historyData.filter(item => {
    if (activeTab !== 'All' && !item.type.includes(activeTab.replace(/s$/, ''))) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Timeline Grouping
  const groupedData = filteredData.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const HistoryCard = ({ item }) => {
    return (
      <div className="card history-card">
        <div className="history-card-header">
          <div className="history-type-badge" style={{ color: item.color, borderColor: `${item.color}40`, backgroundColor: `${item.color}10` }}>
            <item.icon size={12} />
            {item.type}
          </div>
          <Button variant="ghost" icon={Star} className="btn-icon text-muted hover:text-warning" />
        </div>
        
        <div className="history-card-body">
          <h3 className="text-body-large font-bold line-clamp-2" title={item.title}>{item.title}</h3>
          <div className="flex items-center gap-2 text-caption text-muted mt-2">
            <FileText size={14} />
            <span className="truncate">{item.pdf}</span>
          </div>
        </div>
        
        <div className="history-card-footer">
          <span className="text-caption text-muted flex items-center gap-1"><Clock size={12}/> {item.date}</span>
          <div className="history-card-actions">
            <Button variant="ghost" icon={ExternalLink} className="btn-icon text-primary" title="Open" />
            <Button variant="ghost" icon={Copy} className="btn-icon" title="Duplicate" />
            <Button variant="ghost" icon={Share2} className="btn-icon" title="Share" />
            <Button variant="ghost" icon={Trash2} className="btn-icon text-error hover:bg-error/10" title="Delete" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="history-page-container">
      
      {/* HEADER */}
      <div className="history-header animate-fade">
        <div className="history-title-row">
          <div>
            <h1 className="text-display">Activity History</h1>
            <p className="text-body-large text-muted mt-2">Revisit and manage all your AI-generated content.</p>
          </div>
        </div>
        
        <div className="history-tabs hidden-scrollbar">
          {tabs.map(tab => (
            <div 
              key={tab} 
              className={`history-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="history-controls animate-slide">
        <div className="history-search-group">
          <Input 
            iconLeft={Search} 
            placeholder="Search history..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        
        <div className="history-filters-group">
          <Dropdown 
            trigger={<Button variant="outline" icon={Calendar}>Date Range <ChevronDown size={14} className="ml-1"/></Button>}
            items={[{ label: 'Today' }, { label: 'Last 7 Days' }, { label: 'Last 30 Days' }, { label: 'All Time' }]}
          />
          <Dropdown 
            trigger={<Button variant="outline" icon={Filter}>Filters <ChevronDown size={14} className="ml-1"/></Button>}
            items={[{ label: 'Favorites Only' }, { label: 'Has Attachments' }, { label: 'Archived' }]}
          />
          
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 8px' }} className="hidden-mobile" />
          
          <div className="hidden-mobile" style={{ display: 'flex', backgroundColor: 'var(--color-surface-elevated)', borderRadius: 'var(--radius-8)', padding: '2px' }}>
            <button 
              className={`toolbar-btn ${viewMode === 'grid' ? 'active' : ''}`} 
              onClick={() => setViewMode('grid')}
              style={{ backgroundColor: viewMode === 'grid' ? 'var(--color-surface)' : 'transparent', borderRadius: '6px' }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`toolbar-btn ${viewMode === 'list' ? 'active' : ''}`} 
              onClick={() => setViewMode('list')}
              style={{ backgroundColor: viewMode === 'list' ? 'var(--color-surface)' : 'transparent', borderRadius: '6px' }}
              title="List View"
            >
              <ListIcon size={16} />
            </button>
            <button 
              className={`toolbar-btn ${viewMode === 'timeline' ? 'active' : ''}`} 
              onClick={() => setViewMode('timeline')}
              style={{ backgroundColor: viewMode === 'timeline' ? 'var(--color-surface)' : 'transparent', borderRadius: '6px' }}
              title="Timeline View"
            >
              <GitCommit size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="animate-slide" style={{ animationDelay: '0.1s' }}>
        {filteredData.length === 0 ? (
          <EmptyState 
            title="No activity found"
            description="We couldn't find any history matching your current filters."
            icon={Search}
          />
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'timeline' ? (
              <motion.div key="timeline" className="history-timeline-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {Object.entries(groupedData).map(([group, items]) => (
                  <div key={group} className="timeline-group">
                    <div className="timeline-date-marker">{group}</div>
                    <div className="timeline-items">
                      {items.map(item => (
                         <div key={item.id} style={{ maxWidth: '600px' }}>
                           <HistoryCard item={item} />
                         </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key={viewMode}
                className={viewMode === 'grid' ? 'history-grid-view' : 'history-list-view'}
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
              >
                {filteredData.map(item => (
                  <HistoryCard key={item.id} item={item} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

    </div>
  );
}
