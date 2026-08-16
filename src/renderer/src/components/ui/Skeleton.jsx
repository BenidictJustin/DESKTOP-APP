/* eslint-disable */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-300/60 dark:bg-gray-700/50 backdrop-blur-[2px] transition-all duration-300 ${className}`}
      {...props}
    />
  )
}

export default Skeleton
