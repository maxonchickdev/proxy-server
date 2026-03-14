import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':endpointId/summary')
  getSummary(
    @Param('endpointId') endpointId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.analyticsService.getSummary(endpointId, userId);
  }

  @Get(':endpointId/timeseries')
  getTimeseries(
    @Param('endpointId') endpointId: string,
    @CurrentUser('id') userId: string,
    @Query('bucket') bucket?: 'hour' | 'day',
    @Query('limit') limit?: string,
  ) {
    return this.analyticsService.getTimeseries(endpointId, userId, {
      bucket: bucket ?? 'hour',
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':endpointId/breakdown')
  getBreakdown(
    @Param('endpointId') endpointId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.analyticsService.getBreakdown(endpointId, userId);
  }
}
