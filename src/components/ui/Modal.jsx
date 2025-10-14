import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 relative">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <Button onClick={onClose} variant="outline" size="sm">Close</Button>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
