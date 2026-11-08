import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, SendMessageDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** ارسال اعلان توسط مدیر/سرپرست به یک کاربر یا تمام پرسنل */
  async sendNotification(senderId: string, dto: CreateNotificationDto) {
    if (dto.recipientId === 'ALL') {
      const activeUsers = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      const records = activeUsers.map((u) => ({
        recipientId: u.id,
        senderId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
        linkUrl: dto.linkUrl,
      }));

      await this.prisma.staffNotification.createMany({
        data: records,
      });

      return { count: records.length, broadcast: true };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: dto.recipientId },
    });
    if (!user) {
      throw new NotFoundException('کاربر گیرنده یافت نشد.');
    }

    return this.prisma.staffNotification.create({
      data: {
        recipientId: dto.recipientId,
        senderId,
        title: dto.title,
        message: dto.message,
        type: dto.type || 'INFO',
        linkUrl: dto.linkUrl,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });
  }

  /** دریافت اعلان‌های کاربر لاگین‌شده */
  async getMyNotifications(userId: string) {
    return this.prisma.staffNotification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        sender: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });
  }

  /** تعداد اعلان‌های خوانده‌نشده کاربر */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.staffNotification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }

  /** علامت‌گذاری یک اعلان به عنوان خوانده‌شده */
  async markAsRead(userId: string, id: string) {
    return this.prisma.staffNotification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /** علامت‌گذاری تمام اعلان‌ها به عنوان خوانده‌شده */
  async markAllAsRead(userId: string) {
    return this.prisma.staffNotification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // سیستم پیام‌رسان داخلی پرسنل (Internal Chat)
  // ══════════════════════════════════════════════════════════════════════════

  /** ارسال پیام جدید (عمومی در کانال یا خصوصی به کاربر) */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    return this.prisma.internalMessage.create({
      data: {
        senderId,
        recipientId: dto.recipientId || null,
        channelId: dto.recipientId ? null : (dto.channelId || 'general'),
        content: dto.content,
        attachments: dto.attachments || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
            employee: { select: { jobTitle: true } },
          },
        },
      },
    });
  }

  /** دریافت پیام‌های یک کانال عمومی */
  async getChannelMessages(channelId = 'general') {
    return this.prisma.internalMessage.findMany({
      where: { channelId, recipientId: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
            employee: { select: { jobTitle: true } },
          },
        },
      },
    });
  }

  /** دریافت پیام‌های گفتگوی خصوصی بین دو کاربر */
  async getDirectMessages(userId: string, otherUserId: string) {
    return this.prisma.internalMessage.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
            employee: { select: { jobTitle: true } },
          },
        },
      },
    });
  }
}
