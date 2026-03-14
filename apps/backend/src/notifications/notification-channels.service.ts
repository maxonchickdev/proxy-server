import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ChannelType = 'TELEGRAM' | 'SLACK';

export interface CreateChannelDto {
  type: ChannelType;
  config: Record<string, string>;
}

@Injectable()
export class NotificationChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateChannelDto) {
    return this.prisma.notificationChannel.create({
      data: {
        userId,
        type: dto.type,
        config: dto.config as object,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.notificationChannel.findMany({
      where: { userId, isActive: true },
    });
  }

  async findOne(id: string, userId: string) {
    const ch = await this.prisma.notificationChannel.findUnique({
      where: { id },
    });
    if (!ch || ch.userId !== userId) {
      throw new NotFoundException('Channel not found');
    }
    return ch;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.notificationChannel.update({
      where: { id },
      data: { isActive: false },
    });
    return { success: true };
  }
}
