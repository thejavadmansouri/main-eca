import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, SendMessageDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /** ارسال اعلان اختصاصی یا عمومی — فقط مدیران (ADMIN و MANAGER) */
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  sendNotification(@Req() req: any, @Body() dto: CreateNotificationDto) {
    return this.service.sendNotification(req.user.userId, dto);
  }

  /** دریافت اعلان‌های کاربر جاری */
  @Get('my')
  getMyNotifications(@Req() req: any) {
    return this.service.getMyNotifications(req.user.userId);
  }

  /** تعداد اعلان‌های خوانده نشده */
  @Get('unread-count')
  getUnreadCount(@Req() req: any) {
    return this.service.getUnreadCount(req.user.userId);
  }

  /** علامت‌گذاری به عنوان خوانده شده */
  @Patch(':id/read')
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.service.markAsRead(req.user.userId, id);
  }

  /** خوانده شدن همه اعلان‌ها */
  @Patch('read-all')
  markAllAsRead(@Req() req: any) {
    return this.service.markAllAsRead(req.user.userId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // چت و پیام‌رسانی داخلی پرسنل
  // ══════════════════════════════════════════════════════════════════════════

  /** ارسال پیام چت */
  @Post('messages')
  sendMessage(@Req() req: any, @Body() dto: SendMessageDto) {
    return this.service.sendMessage(req.user.userId, dto);
  }

  /** دریافت پیام‌های کانال عمومی (general, sales, workshop, ...) */
  @Get('messages/channel/:channelId')
  getChannelMessages(@Param('channelId') channelId: string) {
    return this.service.getChannelMessages(channelId);
  }

  /** دریافت پیام‌های گفتگوی مستقیم با یک کاربر دیگر */
  @Get('messages/direct/:otherUserId')
  getDirectMessages(@Req() req: any, @Param('otherUserId') otherUserId: string) {
    return this.service.getDirectMessages(req.user.userId, otherUserId);
  }
}
