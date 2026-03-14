import { IsBoolean, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdateEndpointDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Target URL must be a valid URL' })
  targetUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
