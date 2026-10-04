const steps = ['Upload', 'Describe', 'Generate', 'Review', 'Save'];
export function CreationSteps({ current }: { current: number }) {
  return <ol className="creation-steps studio-progress" aria-label="Story creation progress">{steps.map((step, index) => (
    <li key={step} className={`${index <= current ? 'is-reached ' : ''}${index < current ? 'is-complete' : index === current ? 'is-current' : ''}`} aria-current={index === current ? 'step' : undefined}>
      <span aria-hidden="true">{index < current ? '✓' : index + 1}</span>{step}
    </li>
  ))}</ol>;
}
