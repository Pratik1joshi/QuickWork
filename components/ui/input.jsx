import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 placeholder:text-gray-500 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-orange-400 focus:ring-4 focus:ring-orange-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-300 shadow-sm hover:shadow-md",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
