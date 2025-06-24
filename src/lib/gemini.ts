const GEMINI_API_KEY = 'AIzaSyB-7kxyY5VUga-ShdLyWnDiWRanwAXW9r8';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  itemId?: string;
  resourceId?: string;
  timestamp: string;
}

export const generateNotification = async (
  context: string, 
  data: any
): Promise<NotificationData> => {
  try {
    const prompt = `Generate a professional notification for a school inventory management system.
    
Context: ${context}
Data: ${JSON.stringify(data)}

Create a notification that is:
- Professional and clear
- Relevant to the specific action
- Informative but concise
- Appropriate for the school environment

Return ONLY a JSON object with these exact fields:
{
  "title": "Short, clear title (max 50 characters)",
  "message": "Detailed message (max 150 characters)", 
  "type": "success|info|warning|error"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }
    
    const generatedText = result.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const notification = JSON.parse(jsonMatch[0]);
      return {
        ...notification,
        timestamp: new Date().toISOString()
      };
    }

    // Fallback notification based on context
    return createFallbackNotification(context, data);
  } catch (error) {
    console.error('Error generating notification:', error);
    return createFallbackNotification(context, data);
  }
};

const createFallbackNotification = (context: string, data: any): NotificationData => {
  const timestamp = new Date().toISOString();
  
  switch (context.toLowerCase()) {
    case 'item checkout':
      return {
        title: 'Item Checked Out',
        message: `${data.itemName} (Qty: ${data.quantity}) checked out by ${data.userName}`,
        type: 'success',
        timestamp
      };
    case 'item return':
      return {
        title: 'Item Returned',
        message: `${data.itemName} (Qty: ${data.quantity}) returned by ${data.userName}`,
        type: 'success',
        timestamp
      };
    case 'low stock alert':
      return {
        title: 'Low Stock Alert',
        message: `${data.itemName} is running low (${data.currentStock} remaining)`,
        type: 'warning',
        timestamp
      };
    case 'maintenance scheduled':
      return {
        title: 'Maintenance Scheduled',
        message: `Maintenance scheduled for ${data.itemName} on ${data.maintenanceDate}`,
        type: 'info',
        timestamp
      };
    case 'overdue item':
      return {
        title: 'Overdue Item',
        message: `${data.itemName} is overdue for return by ${data.userName}`,
        type: 'error',
        timestamp
      };
    default:
      return {
        title: 'System Update',
        message: 'An action has been completed successfully',
        type: 'info',
        timestamp
      };
  }
};

export const sendNotification = async (notification: NotificationData) => {
  // Store notification in localStorage for demo purposes
  // In production, this would save to database
  const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  const newNotifications = [notification, ...existingNotifications].slice(0, 50); // Keep last 50
  localStorage.setItem('notifications', JSON.stringify(newNotifications));
  
  console.log('Notification sent:', notification);
  return notification;
};

export const getStoredNotifications = (): NotificationData[] => {
  return JSON.parse(localStorage.getItem('notifications') || '[]');
};