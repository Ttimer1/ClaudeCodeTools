/**
 * Sequential Thinking MCP Wrapper
 *
 * Progressive disclosure wrapper for structured thinking processes.
 * Only loaded when complex reasoning or step-by-step analysis is needed.
 *
 * This tool helps break down complex problems into sequential steps,
 * track dependencies, and maintain logical flow.
 *
 * Usage:
 * ```typescript
 * import { SequentialThinkingWrapper } from './sequential-thinking-wrapper';
 * const thinking = new SequentialThinkingWrapper();
 * const plan = thinking.createPlan('Implement video generation feature');
 * ```
 */

interface ThinkingStep {
  id: string;
  description: string;
  reasoning?: string;
  dependencies?: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  result?: any;
}

interface ThinkingPlan {
  goal: string;
  steps: ThinkingStep[];
  currentStep?: string;
  metadata: {
    created: string;
    updated: string;
  };
}

export class SequentialThinkingWrapper {
  private plans: Map<string, ThinkingPlan> = new Map();

  /**
   * Create a structured thinking plan for a complex problem
   *
   * @param goal - The high-level objective
   * @param context - Additional context or constraints
   * @returns A structured plan with sequential steps
   */
  createPlan(goal: string, context?: string): ThinkingPlan {
    const planId = `plan-${Date.now()}`;

    const plan: ThinkingPlan = {
      goal,
      steps: [],
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    };

    this.plans.set(planId, plan);
    return plan;
  }

  /**
   * Add a step to an existing thinking plan
   *
   * @param plan - The thinking plan to modify
   * @param step - Step description and configuration
   * @returns Updated plan
   */
  addStep(
    plan: ThinkingPlan,
    step: {
      description: string;
      reasoning?: string;
      dependencies?: string[];
    }
  ): ThinkingPlan {
    const stepId = `step-${plan.steps.length + 1}`;

    plan.steps.push({
      id: stepId,
      description: step.description,
      reasoning: step.reasoning,
      dependencies: step.dependencies || [],
      status: 'pending',
    });

    plan.metadata.updated = new Date().toISOString();
    return plan;
  }

  /**
   * Mark a step as completed and optionally record the result
   *
   * @param plan - The thinking plan
   * @param stepId - ID of the step to complete
   * @param result - Optional result or output from the step
   * @returns Updated plan
   */
  completeStep(plan: ThinkingPlan, stepId: string, result?: any): ThinkingPlan {
    const step = plan.steps.find((s) => s.id === stepId);

    if (!step) {
      throw new Error(`Step ${stepId} not found in plan`);
    }

    step.status = 'completed';
    step.result = result;
    plan.metadata.updated = new Date().toISOString();

    // Check if any blocked steps can now proceed
    plan.steps.forEach((s) => {
      if (s.status === 'blocked' && s.dependencies) {
        const allDepsCompleted = s.dependencies.every((depId) => {
          const dep = plan.steps.find((st) => st.id === depId);
          return dep?.status === 'completed';
        });

        if (allDepsCompleted) {
          s.status = 'pending';
        }
      }
    });

    return plan;
  }

  /**
   * Get the next actionable step (no incomplete dependencies)
   *
   * @param plan - The thinking plan
   * @returns Next step to work on, or undefined if none available
   */
  getNextStep(plan: ThinkingPlan): ThinkingStep | undefined {
    return plan.steps.find((step) => {
      if (step.status !== 'pending') {
        return false;
      }

      if (!step.dependencies || step.dependencies.length === 0) {
        return true;
      }

      return step.dependencies.every((depId) => {
        const dep = plan.steps.find((s) => s.id === depId);
        return dep?.status === 'completed';
      });
    });
  }

  /**
   * Analyze dependencies and identify potential bottlenecks
   *
   * @param plan - The thinking plan
   * @returns Analysis of plan execution
   */
  analyzePlan(plan: ThinkingPlan): {
    totalSteps: number;
    completedSteps: number;
    blockedSteps: number;
    criticalPath: string[];
    estimatedProgress: number;
  } {
    const totalSteps = plan.steps.length;
    const completedSteps = plan.steps.filter((s) => s.status === 'completed').length;
    const blockedSteps = plan.steps.filter((s) => s.status === 'blocked').length;

    // Simple critical path: longest chain of dependencies
    const criticalPath: string[] = [];
    let maxDepth = 0;

    plan.steps.forEach((step) => {
      const depth = this.getStepDepth(plan, step.id);
      if (depth > maxDepth) {
        maxDepth = depth;
        criticalPath.length = 0;
        criticalPath.push(step.id);
      }
    });

    return {
      totalSteps,
      completedSteps,
      blockedSteps,
      criticalPath,
      estimatedProgress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
    };
  }

  /**
   * Calculate depth of a step in the dependency graph
   */
  private getStepDepth(plan: ThinkingPlan, stepId: string): number {
    const step = plan.steps.find((s) => s.id === stepId);

    if (!step || !step.dependencies || step.dependencies.length === 0) {
      return 0;
    }

    const depthsArray = step.dependencies.map((depId) => this.getStepDepth(plan, depId));
    return 1 + Math.max(...depthsArray);
  }

  /**
   * Format plan as human-readable text
   *
   * @param plan - The thinking plan
   * @returns Formatted plan string
   */
  formatPlan(plan: ThinkingPlan): string {
    let output = `Goal: ${plan.goal}\n\n`;
    output += `Steps:\n`;

    plan.steps.forEach((step, index) => {
      const statusIcon = {
        pending: '⏳',
        in_progress: '🔄',
        completed: '✅',
        blocked: '🚫',
      }[step.status];

      output += `${index + 1}. ${statusIcon} ${step.description}\n`;

      if (step.reasoning) {
        output += `   Reasoning: ${step.reasoning}\n`;
      }

      if (step.dependencies && step.dependencies.length > 0) {
        output += `   Dependencies: ${step.dependencies.join(', ')}\n`;
      }

      output += '\n';
    });

    const analysis = this.analyzePlan(plan);
    output += `Progress: ${analysis.completedSteps}/${analysis.totalSteps} steps (${analysis.estimatedProgress.toFixed(1)}%)\n`;

    return output;
  }
}

// Export convenience function for quick plan creation
export function createThinkingPlan(goal: string, steps: string[]): ThinkingPlan {
  const wrapper = new SequentialThinkingWrapper();
  const plan = wrapper.createPlan(goal);

  steps.forEach((stepDescription) => {
    wrapper.addStep(plan, { description: stepDescription });
  });

  return plan;
}
