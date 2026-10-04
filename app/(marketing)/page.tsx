import { ButtonLink } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { listActiveLeafCategories } from '@/features/catalog/server/categories'

// Static, refreshed hourly so admin category edits show up without a deploy.
export const revalidate = 3600

const steps = [
  {
    title: 'Describe the problem',
    body: 'Say what is wrong in your own words, like "AC no dey cool". We work out who can fix it.',
  },
  {
    title: 'Get responses from checked providers',
    body: 'Providers near you who do this work can ask questions or send a quote.',
  },
  {
    title: 'Hire, then review',
    body: 'Agree on price and time in the chat. After the job, you both leave a review.',
  },
]

const trustPoints = [
  'Our team checks every provider before they can respond to requests.',
  'Reviews only come from real jobs that both sides marked as done.',
  'Your phone number and address stay private until you hire someone.',
]

export default async function HomePage() {
  const categories = await listActiveLeafCategories()

  return (
    <>
      <section className="py-10 sm:py-16">
        <Container>
          <p className="font-semibold text-brand">Home and device repair</p>
          <h1 className="mt-2 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
            Tell us what you need done.
          </h1>
          <p className="mt-4 text-lg text-ink-muted">
            We will find someone nearby who has done it well before. Compare responses, chat, and
            hire the person you trust.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dashboard" size="lg">
              Get started
            </ButtonLink>
            <ButtonLink href="/dashboard" size="lg" variant="secondary">
              I am a provider
            </ButtonLink>
          </div>
        </Container>
      </section>

      <section className="bg-canvas py-10" aria-labelledby="how-it-works">
        <Container>
          <h2 id="how-it-works" className="text-2xl font-bold">
            How it works
          </h2>
          <ol className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-brand font-bold text-white"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-ink-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {categories.length > 0 ? (
        <section className="py-10" aria-labelledby="what-we-fix">
          <Container>
            <h2 id="what-we-fix" className="text-2xl font-bold">
              What we help with
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <li key={category.slug} className="rounded-xl border border-line p-4">
                  <p className="font-semibold">{category.name}</p>
                  {category.description ? (
                    <p className="mt-1 text-sm text-ink-muted">{category.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <section className="bg-canvas py-10" aria-labelledby="why-deydo">
        <Container>
          <h2 id="why-deydo" className="text-2xl font-bold">
            Why people use DeyDo
          </h2>
          <ul className="mt-6 space-y-3">
            {trustPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-brand" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="rounded-[var(--radius-card)] bg-ink p-6 text-white">
            <h2 className="text-2xl font-bold">Do you fix things for a living?</h2>
            <p className="mt-2 text-white/80">
              Get jobs near you and build a record of your work that customers can see.
            </p>
            <ButtonLink href="/dashboard" className="mt-6" variant="secondary">
              Join as a provider
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  )
}
