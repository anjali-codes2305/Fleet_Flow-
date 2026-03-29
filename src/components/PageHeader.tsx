import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

const PageHeader = ({ title, description, children }: PageHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
    >
      <div>
        <motion.h1 
          className="text-2xl font-bold tracking-tight"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {title}
        </motion.h1>
        {description && (
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-sm text-muted-foreground mt-1"
          >
            {description}
          </motion.p>
        )}
      </div>
      {children && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, x: 12 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 20 }}
          className="flex items-center gap-2"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PageHeader;
