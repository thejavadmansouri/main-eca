import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  recipientId: string; // شناسه کاربر یا 'ALL' برای اعلان عمومی به تمامی پرسنل

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  type?: string; // INFO, TASK, WARNING, URGENT, ANNOUNCEMENT

  @IsOptional()
  @IsString()
  linkUrl?: string;
}

export class SendMessageDto {
  @IsOptional()
  @IsString()
  recipientId?: string; // شناسه کاربر گیرنده در پیام خصوصی

  @IsOptional()
  @IsString()
  channelId?: string; // general, sales, workshop, warehouse, logistics

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  attachments?: any;
}
