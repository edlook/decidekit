import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm'
import { Offer } from './offer.entity'

@Entity('product_concepts')
export class ProductConcept {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  brand: string

  @Column()
  name: string

  @Column()
  @Index()
  category: string

  @Column({ nullable: true })
  subcategory: string

  // Key-value attributes: color, material, dimensions, weight, etc.
  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, string>

  // Vector embeddings for semantic similarity search (stored as float array)
  @Column({ type: 'float', array: true, nullable: true })
  embeddings: number[]

  // Relationship graph: other ProductConcept IDs
  @Column({ type: 'jsonb', default: { substitutes: [], upgrades: [], bundles: [], compatible: [] } })
  relationships: {
    substitutes: string[]
    upgrades: string[]
    bundles: string[]
    compatible: string[]
  }

  // Confidence that normalization/matching was accurate (0-1)
  @Column({ type: 'float', default: 1.0 })
  confidenceScore: number

  // Source of product data
  @Column({ default: 'feed' })
  source: string

  @Column({ default: true })
  @Index()
  isActive: boolean

  @OneToMany(() => Offer, (offer) => offer.productConcept)
  offers: Offer[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
