import React from 'react';
import { Cpu, Mail, MapPin, Award, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 border-t border-slate-800 text-slate-400 text-sm font-sans relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Institutional Identity */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/assets/vsb-logo.png"
                alt="VSB College Logo"
                className="w-8 h-8 object-contain shrink-0"
              />
              <span className="font-display font-bold text-white text-lg tracking-wide">
                VSB ENGINEERING COLLEGE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-3">
              DEPARTMENT OF ELECTRONICS & COMMUNICATION ENGINEERING (ESTD. 2002)
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg mb-4">
              Autonomous Institution approved by AICTE, New Delhi, Affiliated to Anna University Chennai. 
              Accredited by NAAC and NBA Accredited Courses. Fostering technical excellence through 
              hands-on hardware prototyping, circuit simulation, and competitive electronics challenges.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                AICTE Approved
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                Anna Univ Affiliated
              </span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-blue-400">
                NBA & NAAC
              </span>
            </div>
          </div>

          {/* Col 2: Electronics Club */}
          <div>
            <h4 className="text-white font-mono text-xs uppercase tracking-wider font-bold mb-3 border-l-2 border-cyan-400 pl-2">
              Electronics Club
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li><span className="text-slate-300">CLUE QUEST Challenge</span></li>
              <li><span className="text-slate-400">ArduFusion Project Expo</span></li>
              <li><span className="text-slate-400">Crack & Act Competition</span></li>
              <li><span className="text-slate-400">Wokwi Circuit Simulation</span></li>
              <li><span className="text-slate-400">PCB Design Workshops</span></li>
            </ul>
          </div>

          {/* Col 3: Department Contact */}
          <div>
            <h4 className="text-white font-mono text-xs uppercase tracking-wider font-bold mb-3 border-l-2 border-cyan-400 pl-2">
              Department Desk
            </h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>NH-67, Covai Road, Karur, Tamil Nadu 639111</span>
              </p>
              <p className="flex items-center gap-2 font-mono">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>hod.ece@vsbec.edu.in</span>
              </p>
              <p className="flex items-center gap-2 font-mono pt-1">
                <ExternalLink className="w-4 h-4 text-slate-500" />
                <a
                  href="https://www.vsbece.online/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  www.vsbece.online
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © 2026 VSB Engineering College Karur | Department of Electronics and Communication Engineering.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>CLUE QUEST Live v1.0</span>
            <span>•</span>
            <span className="text-cyan-400">Neon PostgreSQL Authoritative</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
