import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm'
import { Offer } from './offer.entity'

export type AffiliateNetwork = 'awin' | 'rakuten' | 'impact' | 'direct'

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  name: string

  @Column({ nullable: true })
  logoUrl: string

  @Column({ type: 'enum', enum: ['awin', 'rakuten', 'impact', 'direct'] })
  network: AffiliateNetwork

  // Merchant ID in the affiliate network
  @Column({ nullable: true })
  networkMerchantId: string

  // 0-10 quality/trust score based on link health, return rate, data quality
  @Column({ type: 'float', default: 5.0 })
  qualityScore: number

  // Geo markets this merchant serves
  @Column({ type: 'text', array: true, default: ['US'] })
  geoMarkets: string[]

  @Column({ default: true })
  isActive: boolean

  // Whether our affiliate application has been approved
  @Column({ default: false })
  isApproved: boolean

  @OneToMany(() => Offer, (offer) => offer.merchant)
  offers: Offer[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
