import React from 'react';

interface Event {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  suggestedCategories: string[];
  priority: 'high' | 'medium' | 'low';
}

interface UpcomingEventsProps {
  events: Event[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800';
      case 'low': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800';
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '📅';
      case 'low': return '💡';
      default: return '📌';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Australian calendar highlights</p>
          </div>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
            View calendar →
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {events.map((event) => (
            <div 
              key={event.id}
              className={`p-4 rounded-lg border ${getPriorityColor(event.priority)} hover:shadow-md transition-shadow cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getPriorityIcon(event.priority)}</span>
                  <h4 className="font-medium">{event.title}</h4>
                </div>
                <span className="text-sm font-medium">
                  {formatDate(event.date)}
                </span>
              </div>
              
              <p className="text-sm mb-3 opacity-90">
                {event.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {event.suggestedCategories.map((category) => (
                    <span 
                      key={category}
                      className="px-2 py-1 text-xs bg-white dark:bg-gray-800 bg-opacity-50 rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
                <button className="px-3 py-1 text-xs font-medium bg-white dark:bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full transition-colors">
                  Add to quiz
                </button>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No upcoming events</p>
            <p className="text-xs mt-1">Check back later for calendar highlights</p>
          </div>
        )}
      </div>
    </div>
  );
}
