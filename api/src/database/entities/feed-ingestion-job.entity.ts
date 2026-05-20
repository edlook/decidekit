import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

export type FeedNetwork = 'awin' | 'rakuten' | 'impact'
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'

@Entity('feed_ingestion_jobs')
export class FeedIngestionJob {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'enum', enum: ['awin', 'rakuten', 'impact'] })
  network: FeedNetwork

  @Column({ nullable: true })
  advertiserId: string

  @Column({ type: 'enum', enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' })
  status: JobStatus

  // Feed source URL or S3 path
  @Column({ nullable: true })
  sourceUrl: string

  // Stats after completion
  @Column({ default: 0 })
  totalFetched: number

  @Column({ default: 0 })
  totalNormalized: number

  @Column({ default: 0 })
  totalMatched: number

  @Column({ default: 0 })
  totalSkipped: number

  @Column({ default: 0 })
  totalErrors: number

  @Column({ type: 'text', nullable: true })
  errorMessage: string

  @Column({ nullable: true })
  startedAt: Date

  @Column({ nullable: true })
  completedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
