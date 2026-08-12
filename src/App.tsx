import React, { useState, useEffect } from 'react';
import { UserProfile, Conversation, ChatMessage, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Workspace } from './components/Workspace';
import { AuthModal } from './components/AuthModal';
import { LevelComparerModal } from './components/tools/LevelComparerModal';
import { QuizRunnerModal } from './components/tools/QuizRunnerModal';
import { LessonPlanModal } from './components/tools/LessonPlanModal';
import { FlashcardsModal } from './components/tools/FlashcardsModal';
import { ProfileModal } from './components/ProfileModal';
import { useToast } from './context/ToastContext';
import { DEMO_PRESETS } from './data/demoPresets';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { 
  fetchUserProfile, 
  upsertUserProfile, 
  fetchUserConversations, 
  saveConversationSession, 
  deleteConversationSession, 
  deleteAllUserConversations,
  purgeEmptyConversations,
  recordLearningActivity,
  generateUUID 
} from './lib/dataService';
import { getAchievementById } from './data/achievements';

const STORAGE_KEY_USER = 'culture_ai_user_profile_v2';
const STORAGE_KEY_ACTIVE_VIEW = 'culture_ai_active_view_v2';
const STORAGE_KEY_ACTIVE_CONV = 'culture_ai_active_conv_v2';

export default function App() {
  const { showSuccess, showError, showInfo } = useToast();
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [activeView, setActiveView] = useState<'landing' | 'onboarding' | 'dashboard' | 'workspace'>(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);
      const savedView = localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW);
      if (savedUser && savedView && ['landing', 'onboarding', 'dashboard', 'workspace'].includes(savedView)) {
        return savedView as 'landing' | 'onboarding' | 'dashboard' | 'workspace';
      }
      if (savedUser) return 'dashboard';
    } catch (e) {
      console.error(e);
    }
    return 'landing';
  });

  const [onboardingInitialRole, setOnboardingInitialRole] = useState<UserRole | undefined>(undefined);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authModalRole, setAuthModalRole] = useState<UserRole>('student');
  const [pendingProfile, setPendingProfile] = useState<Partial<UserProfile> | undefined>(undefined);
  const [showLevelComparerModal, setShowLevelComparerModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);
  const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    setUser(updatedProfile);
    await upsertUserProfile(updatedProfile);
  };

  // Clean up legacy global localStorage keys on mount to prevent cross-account leaks
  useEffect(() => {
    try {
      localStorage.removeItem('culture_ai_conversations_v2');
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync profile to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  // Sync active view to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_VIEW, activeView);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_VIEW);
      if (activeView !== 'landing' && activeView !== 'onboarding') {
        setActiveView('landing');
      }
    }
  }, [user, activeView]);

  // Sync active conversation ID to LocalStorage
  useEffect(() => {
    if (user?.id && activeConversationId) {
      localStorage.setItem(`${STORAGE_KEY_ACTIVE_CONV}_${user.id}`, activeConversationId);
    }
  }, [user?.id, activeConversationId]);

  // Unified Supabase Auth and User Conversation initialization
  useEffect(() => {
    let isMounted = true;

    async function syncSessionAndConversations() {
      let activeUserId = user?.id;

      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            activeUserId = session.user.id;
            const loadedProfile = await fetchUserProfile(session.user.id);
            if (loadedProfile && isMounted) {
              setUser(loadedProfile);
            }
          } else if (!session && isMounted) {
            // Unauthenticated: ensure protected views are not exposed
            setUser(null);
            setActiveView('landing');
            localStorage.removeItem(STORAGE_KEY_USER);
            localStorage.removeItem(STORAGE_KEY_ACTIVE_VIEW);
          }
        } catch (err) {
          console.warn('Error fetching session on mount (network/offline):', err);
        }
      }

      if (activeUserId && isMounted) {
        const savedConvs = await fetchUserConversations(activeUserId);
        if (isMounted) {
          setConversations(savedConvs || []);
          if (savedConvs && savedConvs.length > 0) {
            const savedConvId = localStorage.getItem(`${STORAGE_KEY_ACTIVE_CONV}_${activeUserId}`);
            setActiveConversationId((prev) => {
              if (prev && savedConvs.some((c) => c.id === prev)) return prev;
              if (savedConvId && savedConvs.some((c) => c.id === savedConvId)) return savedConvId;
              return savedConvs[0].id;
            });
          } else {
            setActiveConversationId(null);
          }
        }
      }
    }

    syncSessionAndConversations();

    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const loadedProfile = await fetchUserProfile(session.user.id);
        if (loadedProfile && isMounted) {
          setUser(loadedProfile);
        }
        const savedConvs = await fetchUserConversations(session.user.id);
        if (isMounted) {
          setConversations(savedConvs || []);
          if (savedConvs && savedConvs.length > 0) {
            const savedConvId = localStorage.getItem(`${STORAGE_KEY_ACTIVE_CONV}_${session.user.id}`);
            setActiveConversationId((prev) => {
              if (prev && savedConvs.some((c) => c.id === prev)) return prev;
              if (savedConvId && savedConvs.some((c) => c.id === savedConvId)) return savedConvId;
              return savedConvs[0].id;
            });
          } else {
            setActiveConversationId(null);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setConversations([]);
        setActiveConversationId(null);
        setActiveView('landing');
        localStorage.removeItem(STORAGE_KEY_ACTIVE_VIEW);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handlers
  const handleSelectRoleFromLanding = (role: UserRole) => {
    setOnboardingInitialRole(role);
    setAuthModalRole(role);
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  const handleAuthSuccess = async (profile: UserProfile) => {
    setUser(profile);
    setActiveView('dashboard');
    showSuccess(`Welcome back, ${profile.name}!`);
    if (profile.id) {
      const savedConvs = await fetchUserConversations(profile.id);
      setConversations(savedConvs || []);
      if (savedConvs && savedConvs.length > 0) {
        setActiveConversationId(savedConvs[0].id);
      } else {
        setActiveConversationId(null);
      }
    }
  };

  // Clean up empty conversations on window unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id && conversations.length > 0) {
        const emptyConvs = conversations.filter((c) => !c.messages || c.messages.length === 0);
        emptyConvs.forEach((empty) => {
          deleteConversationSession(user.id, empty.id);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id, conversations]);

  const handleNavigateView = async (newView: 'landing' | 'onboarding' | 'dashboard' | 'workspace') => {
    if (activeView === 'workspace' && newView !== 'workspace') {
      const cleanConvs = await purgeEmptyConversations(user?.id, conversations);
      setConversations(cleanConvs);
      if (activeConversationId && !cleanConvs.some((c) => c.id === activeConversationId)) {
        setActiveConversationId(cleanConvs[0]?.id || null);
      }
    }
    setActiveView(newView);
  };

  const handleSelectConversation = async (targetId: string) => {
    if (targetId === activeConversationId) return;

    // Check if the current active conversation has 0 messages
    const currentActive = conversations.find((c) => c.id === activeConversationId);
    let workingConvs = conversations;
    if (currentActive && (!currentActive.messages || currentActive.messages.length === 0)) {
      workingConvs = conversations.filter((c) => c.id !== currentActive.id);
      setConversations(workingConvs);
      if (user?.id) {
        await deleteConversationSession(user.id, currentActive.id);
      }
    }

    setActiveConversationId(targetId);
  };

  const handleLogout = async () => {
    if (user?.id && conversations.length > 0) {
      await purgeEmptyConversations(user.id, conversations);
    }
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    setUser(null);
    setConversations([]);
    setActiveConversationId(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_VIEW);
    localStorage.removeItem('culture_ai_conversations_v2');
    setActiveView('landing');
    showInfo('Signed out successfully.');
  };

  const handleCompleteOnboarding = async (profile: UserProfile) => {
    setPendingProfile(profile);
    setAuthModalRole(profile.role);
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  // Start a new chat thread
  const handleStartNewChat = async (initialPrompt?: string) => {
    const cleanConvs = await purgeEmptyConversations(user?.id, conversations);

    const newConv: Conversation = {
      id: generateUUID(),
      title: initialPrompt ? initialPrompt.slice(0, 30) + (initialPrompt.length > 30 ? '...' : '') : 'New AI Conversation',
      messages: [],
      updatedAt: Date.now(),
      subject: user?.subjects[0] || 'General'
    };

    const nextConvs = [newConv, ...cleanConvs];
    setConversations(nextConvs);
    setActiveConversationId(newConv.id);
    setActiveView('workspace');

    if (initialPrompt) {
      await handleSendMessageToConv(newConv.id, initialPrompt, nextConvs);
    }
  };

  const handleSendMessageToConv = async (convId: string, text: string, currentConvs = conversations) => {
    if (!text.trim() || isGenerating) return;

    let targetConvId = convId;
    let workingConvs = currentConvs;

    if (!targetConvId || targetConvId === 'conv-1' || !workingConvs.some((c) => c.id === targetConvId)) {
      const newConv: Conversation = {
        id: generateUUID(),
        title: text.slice(0, 35) + (text.length > 35 ? '...' : ''),
        messages: [],
        updatedAt: Date.now(),
        subject: user?.subjects[0] || 'General',
      };
      targetConvId = newConv.id;
      workingConvs = [newConv, ...workingConvs];
      setConversations(workingConvs);
      setActiveConversationId(targetConvId);
      if (user?.id) {
        await saveConversationSession(user.id, newConv);
      }
    }

    const userMsg: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    const updatedConvs = workingConvs.map((c) => {
      if (c.id === targetConvId) {
        const title = c.messages.length === 0 ? text.slice(0, 35) + (text.length > 35 ? '...' : '') : c.title;
        return {
          ...c,
          title,
          updatedAt: Date.now(),
          messages: [...c.messages, userMsg],
        };
      }
      return c;
    });

    setConversations(updatedConvs);
    setIsGenerating(true);

    const targetConvObj = updatedConvs.find((c) => c.id === targetConvId);
    if (user?.id && targetConvObj) {
      await saveConversationSession(user.id, targetConvObj);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('Authentication required. Please sign in to continue.');
      }

      const activeConv = updatedConvs.find((c) => c.id === targetConvId);
      const history = activeConv ? activeConv.messages : [];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: text,
          history,
          context: {
            role: user?.role,
            educationLevel: user?.educationLevel,
            grade: user?.educationLevel,
            subjects: user?.subjects,
            learningGoal: user?.goal,
            goal: user?.goal,
            preferredLanguage: user?.language || 'English',
            language: user?.language || 'English',
            name: user?.name,
          },
        }),
      });

      const resText = await response.text();
      let data: any = {};
      if (resText && resText.trim()) {
        try {
          data = JSON.parse(resText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `Server error (${response.status})`);
      }

      const assistantReply = data.text || 'I apologize, but I could not generate a response.';

      const assistantMsg: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        text: assistantReply,
        timestamp: Date.now(),
      };

      const currentTargetConv = conversations.find((c) => c.id === targetConvId) || updatedConvs.find((c) => c.id === targetConvId);
      const baseMessages = currentTargetConv ? currentTargetConv.messages : [];
      const hasUserMsg = baseMessages.some((m) => m.id === userMsg.id);
      const updatedMessages = hasUserMsg
        ? [...baseMessages, assistantMsg]
        : [...baseMessages, userMsg, assistantMsg];

      const finalUpdatedConv: Conversation = {
        ...(currentTargetConv || {
          id: targetConvId,
          title: text.slice(0, 35) + (text.length > 35 ? '...' : ''),
          subject: user?.subjects[0] || 'General',
        }),
        updatedAt: Date.now(),
        messages: updatedMessages,
      };

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === targetConvId);
        if (exists) {
          return prev.map((c) => (c.id === targetConvId ? finalUpdatedConv : c));
        }
        return [finalUpdatedConv, ...prev];
      });

      if (user?.id) {
        await saveConversationSession(user.id, finalUpdatedConv);
      }

      // Record AI session activity in persistent database
      if (user?.id) {
        recordLearningActivity(
          user.id,
          'ai_learning_session',
          user.subjects[0] || 'General',
          text.slice(0, 30),
          { length: text.length }
        ).then((res) => {
          if (res?.newlyUnlockedAchievements?.length) {
            for (const achId of res.newlyUnlockedAchievements) {
              const ach = getAchievementById(achId);
              if (ach) {
                showSuccess(`🏆 Achievement Unlocked: ${ach.title} — ${ach.description}`);
              } else {
                console.warn(`[CULTURE AI] Unknown achievement unlocked ID: ${achId}`);
              }
            }
          }
        }).catch((err) => {
          console.error('[CULTURE AI] Toast achievement alert error:', err);
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg = err?.message || 'Failed to connect to CULTURE AI backend.';
      showError(`AI Error: ${errorMsg}`);
      const errorAssistantMsg: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        text: `⚠️ **AI Service Error**: ${errorMsg}`,
        timestamp: Date.now(),
      };

      const currentTargetConv = conversations.find((c) => c.id === targetConvId) || updatedConvs.find((c) => c.id === targetConvId);
      const baseMessages = currentTargetConv ? currentTargetConv.messages : [];
      const hasUserMsg = baseMessages.some((m) => m.id === userMsg.id);
      const updatedMessages = hasUserMsg
        ? [...baseMessages, errorAssistantMsg]
        : [...baseMessages, userMsg, errorAssistantMsg];

      const finalUpdatedConv: Conversation = {
        ...(currentTargetConv || {
          id: targetConvId,
          title: text.slice(0, 35) + (text.length > 35 ? '...' : ''),
          subject: user?.subjects[0] || 'General',
        }),
        updatedAt: Date.now(),
        messages: updatedMessages,
      };

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === targetConvId);
        if (exists) {
          return prev.map((c) => (c.id === targetConvId ? finalUpdatedConv : c));
        }
        return [finalUpdatedConv, ...prev];
      });

      if (user?.id) {
        await saveConversationSession(user.id, finalUpdatedConv);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || conversations[0] || null;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E5E7EB] font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* NAVBAR */}
      <Navbar
        user={user}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setShowAuthModal(true);
        }}
        onLogout={handleLogout}
        onOpenLevelComparer={() => setShowLevelComparerModal(true)}
        onOpenProfileModal={() => setShowProfileModal(true)}
        activeView={activeView}
        setActiveView={handleNavigateView}
      />

      {/* VIEWS ROUTER */}
      {activeView === 'landing' && (
        <LandingPage
          onSelectRole={handleSelectRoleFromLanding}
          onSelectPresetAndLaunch={(role, level) => {
            const preset = DEMO_PRESETS.find(p => p.profile.role === role && (level ? p.profile.educationLevel === level : true));
            if (preset) {
              setUser(preset.profile);
              setActiveView('dashboard');
            } else {
              handleSelectRoleFromLanding(role);
            }
          }}
          onOpenLevelComparer={() => setShowLevelComparerModal(true)}
        />
      )}

      {activeView === 'onboarding' && (
        <Onboarding
          initialRole={onboardingInitialRole}
          onCompleteOnboarding={handleCompleteOnboarding}
          onBackToLanding={() => setActiveView('landing')}
        />
      )}

      {activeView === 'dashboard' && user && (
        <Dashboard
          user={user}
          conversations={conversations}
          onStartNewChat={(initialPrompt) => handleStartNewChat(initialPrompt)}
          onResumeConversation={(id) => {
            setActiveConversationId(id);
            setActiveView('workspace');
          }}
          onOpenQuizModal={() => setShowQuizModal(true)}
          onOpenLessonPlanModal={() => setShowLessonPlanModal(true)}
          onOpenLevelComparerModal={() => setShowLevelComparerModal(true)}
          onOpenFlashcardsModal={() => setShowFlashcardsModal(true)}
          onOpenProfileModal={() => setShowProfileModal(true)}
        />
      )}

      {activeView === 'workspace' && user && (
        <Workspace
          user={user}
          activeConversation={activeConversation}
          conversations={conversations}
          onSendMessage={(text) => handleSendMessageToConv(activeConversationId || '', text)}
          onStartNewChat={() => handleStartNewChat()}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={async (id) => {
            const nextConvs = conversations.filter(c => c.id !== id);
            setConversations(nextConvs);
            if (activeConversationId === id) {
              setActiveConversationId(nextConvs[0]?.id || null);
            }
            if (user?.id) {
              await deleteConversationSession(user.id, id);
            }
          }}
          onDeleteAllConversations={async () => {
            setConversations([]);
            setActiveConversationId(null);
            if (user?.id) {
              await deleteAllUserConversations(user.id);
            }
          }}
          onBackToDashboard={() => handleNavigateView('dashboard')}
          onOpenQuizModal={() => setShowQuizModal(true)}
          onOpenLessonPlanModal={() => setShowLessonPlanModal(true)}
          onOpenLevelComparerModal={() => setShowLevelComparerModal(true)}
          onOpenFlashcardsModal={() => setShowFlashcardsModal(true)}
          isGenerating={isGenerating}
        />
      )}

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authModalMode}
        initialRole={authModalRole}
        pendingProfile={pendingProfile}
      />

      {/* TOOL MODALS */}
      <LevelComparerModal
        isOpen={showLevelComparerModal}
        onClose={() => setShowLevelComparerModal(false)}
      />

      {user && (
        <>
          <QuizRunnerModal
            isOpen={showQuizModal}
            onClose={() => setShowQuizModal(false)}
            user={user}
          />

          <LessonPlanModal
            isOpen={showLessonPlanModal}
            onClose={() => setShowLessonPlanModal(false)}
            user={user}
          />

          <FlashcardsModal
            isOpen={showFlashcardsModal}
            onClose={() => setShowFlashcardsModal(false)}
            user={user}
          />

          <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            user={user}
            onSaveProfile={handleSaveProfile}
          />
        </>
      )}

    </div>
  );
}
