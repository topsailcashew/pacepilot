// Browser Notification Service for Pace Pilot

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

class NotificationService {
  private permissionGranted: boolean = false;

  constructor() {
    this.init();
  }

  private async init() {
    if ('Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  async send(options: NotificationOptions): Promise<void> {
    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) {
        console.warn('Notification permission not granted');
        return;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.svg',
        tag: options.tag || 'pace-pilot',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        badge: '/icon-192.png',
      });

      // Auto-close after 5 seconds if not requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Predefined notification types
  async pomodoroComplete() {
    await this.send({
      title: 'Pomodoro Complete!',
      body: 'Great focus session! Time for a break.',
      tag: 'pomodoro-complete',
      requireInteraction: true,
    });
  }

  async breakComplete() {
    await this.send({
      title: 'Break Over!',
      body: 'Ready to get back to work?',
      tag: 'break-complete',
      requireInteraction: true,
    });
  }

  async taskReminder(taskTitle: string) {
    await this.send({
      title: 'Task Reminder',
      body: `Don't forget: ${taskTitle}`,
      tag: `task-${taskTitle}`,
    });
  }

  async dailyGoalComplete() {
    await this.send({
      title: 'Daily Goal Complete!',
      body: 'You have completed all your tasks for today!',
      tag: 'daily-complete',
      requireInteraction: true,
    });
  }

  async streakMilestone(days: number) {
    await this.send({
      title: `${days}-Day Streak!`,
      body: `Amazing! You have maintained your productivity streak for ${days} days!`,
      tag: 'streak-milestone',
      requireInteraction: true,
    });
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }

  hasPermission(): boolean {
    return this.permissionGranted;
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
