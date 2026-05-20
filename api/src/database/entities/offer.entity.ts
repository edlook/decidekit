import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm'
import { ProductConcept } from './product-concept.entity'
import { Merchant } from './merchant.entity'

export type AvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ManyToOne(() => ProductConcept, (pc) => pc.offers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_concept_id' })
  productConcept: ProductConcept

  @Column({ name: 'product_concept_id' })
  @Index()
  productConceptId: string

  @ManyToOne(() => Merchant, (m) => m.offers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant

  @Column({ name: 'merchant_id' })
  @Index()
  merchantId: string

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number

  @Column({ default: 'USD' })
  currency: string

  @Column({ type: 'enum', enum: ['in_stock', 'low_stock', 'out_of_stock', 'unknown'], default: 'unknown' })
  availability: AvailabilityStatus

  // Geo markets where this offer is valid
  @Column({ type: 'text', array: true, default: [] })
  geo: string[]

  // Raw deeplink from affiliate network (before subId injection)
  @Column({ type: 'text' })
  deeplink: string

  // Network-specific tracking token
  @Column({ nullable: true })
  trackingToken: string

  // Image URL from feed
  @Column({ nullable: true })
  imageUrl: string

  // Confidence that this offer is valid/current
  @Column({ type: 'float', default: 1.0 })
  confidenceScore: number

  // Whether the price was updated in the last 24h
  @Column({ default: false })
  isPriceStale: boolean

  @Column({ nullable: true })
  priceLastCheckedAt: Date

  @Column({ default: true })
  @Index()
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
