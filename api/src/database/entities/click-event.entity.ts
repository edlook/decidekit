import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm'

export type FlowMode = 'builder' | 'dupe' | 'battles' | 'direct'
export type RedirectStatus = 'pending' | 'success' | 'fail' | 'fallback'

@Entity('click_events')
export class ClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string

  // Anonymous session ID from client storage
  @Column()
  @Index()
  sessionId: string

  @Column()
  @Index()
  offerId: string

  @Column()
  merchantId: string

  @Column()
  productConceptId: string

  @Column({ type: 'enum', enum: ['builder', 'dupe', 'battles', 'direct'], default: 'direct' })
  mode: FlowMode

  // The affiliate deeplink we generated
  @Column({ type: 'text', nullable: true })
  generatedDeeplink: string

  // Tracking subId we appended (format: sessionId_offerId_timestamp)
  @Column({ nullable: true })
  subId: string

  @Column({ type: 'enum', enum: ['pending', 'success', 'fail', 'fallback'], default: 'pending' })
  redirectStatus: RedirectStatus

  // User's country from request headers
  @Column({ nullable: true })
  geo: string

  @Column({ nullable: true })
  userAgent: string

  // Result variant selected (budget/balanced/premium) if from builder
  @Column({ nullable: true })
  resultVariant: string

  @CreateDateColumn()
  @Index()
  createdAt: Date
}
