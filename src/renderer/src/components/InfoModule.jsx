import React from 'react';
import { motion } from 'motion/react';
import { AnimatedList, AnimatedListItem } from './motion/AnimatedList';
import { Award, Compass, Shield, Users, Code } from 'lucide-react';

export default function InfoModule() {
  const developers = [
    {
      name: 'Angel',
      role: 'Lead Developer & Architect',
      description: 'Responsible for full-stack system implementation, database scheme mapping, and Electron integration.',
      avatarText: 'A'
    },
    {
      name: 'Dominican Proponents Group',
      role: 'System Analysts & Proponents',
      description: 'Collaborated with the Dominican College of Tarlac CES office to analyze requirements and define specifications.',
      avatarText: 'DP'
    }
  ];

  return (
    <AnimatedList className="w-full space-y-8 font-poppins pb-8">
      {/* Page Header */}
      <AnimatedListItem className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-blue">Information Center</h1>
          <p className="text-gray-500 text-xs mt-1">Official CES Office guidelines, organizational hierarchy, and developer credits.</p>
        </div>
        <div className="h-1 bg-sig-green w-16 md:w-32 rounded-full mt-3 md:mt-0"></div>
      </AnimatedListItem>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Mission & Vision */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sig-green/5 rounded-bl-full"></div>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-sig-green/15 text-navy-blue rounded-2xl">
                <Compass className="w-6 h-6 text-navy-blue" />
              </div>
              <h2 className="text-xl font-bold text-navy-blue">Vision Statement</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              We envision the Community Extension and Services (CES) Office as a dynamic and responsive center of excellence 
              that leads the Dominican College of Tarlac in fostering sustainable community development. Through mutual 
              collaboration, we strive to empower marginalized partner communities, transforming both students and residents 
              into agents of social and ecological conversion.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-navy-blue/5 rounded-bl-full"></div>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-navy-blue/15 text-navy-blue rounded-2xl">
                <Shield className="w-6 h-6 text-navy-blue" />
              </div>
              <h2 className="text-xl font-bold text-navy-blue">Mission Statement</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              The CES Office is committed to translating academic concepts into genuine life-based learning experiences 
              by engaging in grassroots exposure and community partnership. We deliver targeted, impactful services—including 
              educational, health, relief, and livelihood initiatives—designed in solidarity with our partners to promote 
              growth, self-reliance, and the common good in the light of Dominican values.
            </p>
          </div>

          {/* CEAP / JEEPGY Advocacy Areas */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 bg-sig-green/15 text-navy-blue rounded-2xl">
                <Award className="w-6 h-6 text-navy-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-navy-blue">CEAP & JEEPGY Core Advocacies</h2>
                <p className="text-gray-500 text-xs mt-0.5">Catholic Education Association of the Philippines pillars supported by JEEPGY Advocates</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Justice and Peace', desc: 'Promoting human rights, fairness, and non-violent resolutions to conflicts.' },
                { title: 'Care for the Environment', desc: 'Advocating ecological conversion, waste management, and environmental stewardship.' },
                { title: 'Active Citizenship', desc: 'Empowering communities to participate in democratic governance and civic engagement.' },
                { title: 'Poverty Awareness', desc: 'Solidarity with the poor, addressing immediate food security, and resource distribution.' },
                { title: 'Gender Equality', desc: 'Promoting equal dignity and opportunities for all men and women.' },
                { title: 'Youth Empowerment', desc: 'Fostering student leadership, creativity, and service participation.' }
              ].map((adv, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-sig-green/30 transition duration-200">
                  <h3 className="font-bold text-navy-blue text-sm mb-1">{adv.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{adv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Org Chart & Developer Profile Cards */}
        <div className="space-y-6">
          {/* Org Personnel */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2.5 mb-5 text-navy-blue">
              <Users className="w-5 h-5" />
              <h2 className="font-bold text-base">Office Personnel Chart</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { role: 'School Administrator', name: 'Sr. Lorna I. Ablog, O.P.', detail: 'Dominican College of Tarlac, Inc.' },
                { role: 'VP of Academic Affairs', name: 'Dr. Augusto R. Dela Cruz', detail: 'Academic Integration' },
                { role: 'Head of CES Office', name: 'Mrs. Faithful Anne F. Arugay', detail: 'Head Executive & Admin' },
                { role: 'CES Office Coordinator', name: 'Mr. Jonnel B. Manio', detail: 'Operations & Review Coordinator' }
              ].map((person, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-sig-green">
                  <div className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">{person.role}</div>
                  <div className="text-xs font-bold text-navy-blue mt-0.5">{person.name}</div>
                  <div className="text-[10px] text-gray-400">{person.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Developers Credits */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-navy-blue/5 rounded-bl-full"></div>
            
            <div className="flex items-center space-x-2.5 mb-5 text-navy-blue">
              <Code className="w-5 h-5 text-navy-blue" />
              <h2 className="font-bold text-base">System Proponents</h2>
            </div>

            <div className="space-y-4">
              {developers.map((dev, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-navy-blue text-white flex items-center justify-center font-bold text-xs">
                      {dev.avatarText}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-blue">{dev.name}</h4>
                      <p className="text-[10px] text-sig-green font-medium">{dev.role}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{dev.description}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-5 p-3 bg-sig-green/5 border border-sig-green/20 rounded-xl text-center text-[10px] text-navy-blue font-medium">
              DommUnity Desktop v1.0.0 © 2026
            </div>
          </div>
        </div>
      </div>
    </AnimatedList>
  );
}
