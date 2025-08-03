"use client";

import React from 'react';
import DialogueAvatar from './DialogueAvatar';

// Test component to verify avatar system functionality
export default function DialogueAvatarTest() {
  const testCharacters = [
    { name: 'Teacher Smith', isTeacher: true, role: 'teacher' },
    { name: 'Student Alice', isTeacher: false, role: 'student' },
    { name: 'Dr. Johnson', isTeacher: false, role: 'doctor' },
    { name: 'Customer Mary', isTeacher: false, role: 'customer' },
    { name: 'Friend Bob', isTeacher: false, role: 'friend' },
    { name: 'Mom', isTeacher: false, role: 'family' },
    { name: 'Manager Wilson', isTeacher: false, role: 'professional' },
    { name: 'Waiter John', isTeacher: false, role: 'service' },
    { name: 'Unknown Person', isTeacher: false, role: 'default' },
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Dialogue Avatar System Test
      </h2>
      
      <div className="grid grid-cols-3 gap-4">
        {testCharacters.map((char, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <DialogueAvatar
              character={char.name}
              isTeacher={char.isTeacher}
              role={char.role}
              size="md"
            />
            <div>
              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                {char.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {char.role} {char.isTeacher ? '(Teacher)' : ''}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          Size Variations
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <DialogueAvatar character="Small Avatar" size="sm" />
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">Small</p>
          </div>
          <div className="text-center">
            <DialogueAvatar character="Medium Avatar" size="md" />
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">Medium</p>
          </div>
          <div className="text-center">
            <DialogueAvatar character="Large Avatar" size="lg" />
            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">Large</p>
          </div>
        </div>
      </div>
    </div>
  );
}