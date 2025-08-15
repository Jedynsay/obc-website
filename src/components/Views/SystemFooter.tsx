import React from 'react';

export function SystemFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between text-slate-500 text-sm">
        <div>Created by Jedynsay • Powered by Supabase</div>
        <div className="mt-2 sm:mt-0">System Online</div>
        <div>OBC Portal beta v0.3</div>
      </div>
    </footer>
  );
}
