import { IsIn } from 'class-validator';

export class CreateSessionDto {
  @IsIn(['wills', 'conveyancing'])
  domain!: 'wills' | 'conveyancing';
}
