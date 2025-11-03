import { IsBoolean } from 'class-validator';

export class ToggleOrderSubscriptionDto {
  @IsBoolean()
  active: boolean;
}
