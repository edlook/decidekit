'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all duration-[var(--transition)] select-none',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',

          // sizes
          size === 'sm' && 'px-3 py-1.5 text-sm',
          size === 'md' && 'px-4 py-2.5 text-sm',
          size === 'lg' && 'px-6 py-3.5 text-base',

          // variants
          variant === 'primary' &&
            'bg-[var(--accent)] text-[#0a0a0b] hover:brightness-110 active:scale-[0.98]',
          variant === 'secondary' &&
            'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-3)] active:scale-[0.98]',
          variant === 'ghost' &&
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-3)] active:scale-[0.98]',
          variant === 'danger' &&
            'border border-[var(--red-dim)] bg-[var(--red-dim)] text-[var(--red)] hover:border-[var(--red)]/30 active:scale-[0.98]',

          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            Loading…
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
