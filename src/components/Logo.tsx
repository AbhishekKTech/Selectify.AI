import Link from 'next/link'
import React from 'react'

const Logo = () => {
  return (
    <Link href={'/'} prefetch={false}>
        <div>
            {/* Changed from text-white to text-foreground so it adapts to Light/Dark mode */}
            <p className='font-bold text-2xl text-foreground px-2 py-1 flex flex-row gap-2'>
              Selectify<span className="text-indigo-600">.AI</span>
            </p>
        </div>
    </Link>
  )
}

export default Logo