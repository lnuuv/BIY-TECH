import React, { lazy, Suspense } from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import FloatingAssistant from './components/FloatingAssistant.jsx';
import Home from './pages/Home.jsx';
import Learn from './pages/Learn.jsx';
import Lesson from './pages/Lesson.jsx';
import Shortcuts from './pages/Shortcuts.jsx';

const Infrastructure = lazy(() => import('./pages/Infrastructure.jsx'));
const Models = lazy(() => import('./pages/Models.jsx'));
const Lab = lazy(() => import('./pages/Lab.jsx'));
const Practice = lazy(() => import('./pages/Practice.jsx'));
const Games = lazy(() => import('./pages/Games.jsx'));
const Assignment = lazy(() => import('./pages/Assignment.jsx'));
const Assistant = lazy(() => import('./pages/Assistant.jsx'));
const Progress = lazy(() => import('./pages/Progress.jsx'));
const Story = lazy(() => import('./pages/Story.jsx'));
const ARView = lazy(() => import('./pages/ARView.jsx'));

export default function App() {
  const path = useLocation().pathname;
  const isStory = path.startsWith('/story') || path.startsWith('/ar');
  return (
    <>
      <Routes>
        <Route path="story" element={<Suspense fallback={<div className="story" />}><Story /></Suspense>} />
        <Route path="ar" element={<Suspense fallback={<div className="ar-page" />}><ARView /></Suspense>} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="learn" element={<Learn />} />
          <Route path="learn/shortcuts" element={<Shortcuts />} />
          <Route path="learn/:id" element={<Lesson />} />
          <Route path="shortcuts" element={<Shortcuts />} />
          <Route path="infrastructure" element={<Infrastructure />} />
          <Route path="models" element={<Models />} />
          <Route path="lab" element={<Lab />} />
          <Route path="practice" element={<Practice />} />
          <Route path="games" element={<Games />} />
          <Route path="assignment" element={<Assignment />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="progress" element={<Progress />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {!isStory && <FloatingAssistant />}
    </>
  );
}