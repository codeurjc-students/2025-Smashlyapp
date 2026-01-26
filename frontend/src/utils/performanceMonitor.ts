import React from 'react';

/**
 * Performance Monitoring Utility
 * Tracks Core Web Vitals and custom performance metrics
 */

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  loadTime?: number; // Page load time
  customMetrics?: Record<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: PerformanceObserver[] = [];
  private navigationStart: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && window.performance) {
      this.navigationStart = performance.timing.navigationStart;
    }
  }

  /**
   * Start monitoring performance metrics
   */
  startMonitoring() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Measure Largest Contentful Paint (LCP)
      this.observeLCP();

      // Measure First Input Delay (FID)
      this.observeFID();

      // Measure Cumulative Layout Shift (CLS)
      this.observeCLS();

      // Measure page load time
      this.measurePageLoad();

      // Measure Time to First Byte (TTFB)
      this.measureTTFB();
    } catch (error) {
      console.error('Error starting performance monitoring:', error);
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (e) {
      // LCP might not be supported
      console.warn('LCP observation failed:', e);
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;
        this.metrics.fid = firstEntry.processingStart - firstEntry.startTime;
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (e) {
      // FID might not be supported
      console.warn('FID observation failed:', e);
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.metrics.cls = clsValue;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('CLS observation failed:', e);
    }
  }

  /**
   * Measure page load time
   */
  private measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance && (window.performance as any).timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = (window.performance as any).timing;
          this.metrics.loadTime = timing.loadEventEnd - this.navigationStart;
          this.metrics.fcp = timing.domContentLoadedEventEnd - this.navigationStart;
        }, 0);
      });
    }
  }

  /**
   * Measure Time to First Byte
   */
  private measureTTFB() {
    if (typeof window !== 'undefined' && window.performance && (window.performance as any).timing) {
      const timing = (window.performance as any).timing;
      this.metrics.ttfb = timing.responseStart - this.navigationStart;
    }
  }

  /**
   * Measure custom metric
   */
  measureCustom(name: string, value: number) {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {};
    }
    this.metrics.customMetrics[name] = value;
  }

  /**
   * Mark a performance timestamp
   */
  mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        performance.mark(name);
      } catch (e) {
        // Ignore errors if mark already exists
      }
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.measureCustom(name, measure.duration);
        }
      } catch (e) {
        console.warn(`Failed to measure ${name}:`, e);
      }
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log metrics to console (useful for development)
   */
  logMetrics() {
    console.group('🚀 Performance Metrics');
    console.table(this.metrics);
    console.groupEnd();

    // Check against recommended thresholds
    console.group('⚠️ Performance Analysis');
    if (this.metrics.lcp) {
      console.log(
        `LCP: ${this.metrics.lcp.toFixed(0)}ms`,
        this.metrics.lcp < 2500 ? '✅ Good' : this.metrics.lcp < 4000 ? '⚠️ Needs Improvement' : '❌ Poor'
      );
    }
    if (this.metrics.fid) {
      console.log(
        `FID: ${this.metrics.fid.toFixed(0)}ms`,
        this.metrics.fid < 100 ? '✅ Good' : this.metrics.fid < 300 ? '⚠️ Needs Improvement' : '❌ Poor'
      );
    }
    if (this.metrics.cls) {
      console.log(
        `CLS: ${this.metrics.cls.toFixed(3)}`,
        this.metrics.cls < 0.1 ? '✅ Good' : this.metrics.cls < 0.25 ? '⚠️ Needs Improvement' : '❌ Poor'
      );
    }
    console.groupEnd();
  }

  /**
   * Send metrics to analytics service
   */
  async sendToAnalytics(endpoint: string) {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.metrics),
      });
    } catch (error) {
      console.error('Failed to send metrics to analytics:', error);
    }
  }

  /**
   * Stop all observers
   */
  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export const usePerformanceMonitor = () => {
  React.useEffect(() => {
    performanceMonitor.startMonitoring();
    return () => {
      performanceMonitor.stopMonitoring();
    };
  }, []);

  return {
    metrics: performanceMonitor.getMetrics(),
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureCustom: performanceMonitor.measureCustom.bind(performanceMonitor),
    logMetrics: performanceMonitor.logMetrics.bind(performanceMonitor),
  };
};

export default PerformanceMonitor;
