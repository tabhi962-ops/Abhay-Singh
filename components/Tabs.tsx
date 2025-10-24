
import React from 'react';
import { AppTab } from '../types';
import { GenerateIcon, EditIcon, AnalyzeIcon } from './Icons';

interface TabsProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

const tabConfig = {
    [AppTab.GENERATE]: { icon: GenerateIcon },
    [AppTab.EDIT]: { icon: EditIcon },
    [AppTab.ANALYZE]: { icon: AnalyzeIcon },
};

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = Object.values(AppTab);

  return (
    <div className="flex justify-center border-b border-gray-700 mb-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        const Icon = tabConfig[tab].icon;
        return (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm md:text-base font-medium transition-colors duration-200 ease-in-out focus:outline-none ${
              isActive
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'border-b-2 border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{tab}</span>
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
