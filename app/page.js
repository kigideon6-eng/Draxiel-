
import Link from 'next/link';
import { APP_NAME, APP_TAGLINE } from '../lib/config';
import Logo from '../components/Logo';

export default function HomePage() {
  return (
    <main>
      <header className="bg-forest text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold flex items-center gap-2">
  <Logo size={32} />
  {APP_NAME}
</span>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-bold px-3 py-2">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-forest text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl sm:text-4xl leading-tight">
            When too many farmers harvest the same crop, prices crash.
            <span className="text-gold"> {APP_NAME.replace('.ai', '')}</span> helps you sell before that happens.
          </h1>
          <p className="mt-5 text-base opacity-90 max-w-xl mx-auto">
            {APP_TAGLINE}. List your produce, reach buyers directly, track your farm
            records, and get crop and weather guidance for your own state and LGA.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup?role=farmer" className="btn-primary">
              I am a farmer
            </Link>
            <Link href="/signup?role=buyer" className="btn-secondary !text-white !border-white">
              I am a buyer
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <h2 className="text-2xl text-center mb-8">The problem this platform exists to solve</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="card p-5">
              <h3 className="text-base font-bold mb-2">Oversupply crashes prices</h3>
              <p className="text-sm text-charcoal/80">
                When many farmers plant and harvest the same crop at the same time, the market
                floods and prices fall right when farmers need income most.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="text-base font-bold mb-2">Middlemen take the margin</h3>
              <p className="text-sm text-charcoal/80">
                Without a direct link to buyers, farmers often sell to agents at a fraction of
                what the produce is later resold for.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="text-base font-bold mb-2">No visibility before planting</h3>
              <p className="text-sm text-charcoal/80">
                Farmers rarely know what others nearby are already growing until harvest,
                when it is too late to change course.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-b border-line">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <h2 className="text-2xl text-center mb-8">What you get</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            <Feature
              title="Direct marketplace"
              body="List produce or animals for sale and reach buyers directly, without a middleman taking a cut."
            />
            <Feature
              title="Farm and produce records"
              body="Track your farms, what you have in stock, and what has sold, all in one place."
            />
            <Feature
              title="AI crop advisor"
              body="Ask farming questions and get guidance shaped by your state and LGA."
            />
            <Feature
              title="Weather by LGA"
              body="Check conditions for your specific local government area before you plant or harvest."
            />
            <Feature
              title="Escrow-protected orders"
              body="A buyer's payment is held until the farmer confirms delivery, so both sides are protected."
            />
            <Feature
              title="Buyer payment history"
              body="Buyers can track every order and payment they have made on the platform."
            />
          </div>
        </div>
      </section>

      <section className="bg-forest text-white">
        <div className="max-w-3xl mx-auto px-4 py-14 text-center">
          <h2 className="text-2xl mb-3">Set up your account</h2>
          <p className="opacity-90 mb-6">Free to join. You choose your state and LGA so the platform shows you what is relevant to your area.</p>
          <Link href="/signup" className="btn-primary">
            Create account
          </Link>
        </div>
      </section>

      <footer className="bg-forest-dark text-white/70 text-sm text-center py-6">
        {APP_NAME}
      </footer>
    </main>
  );
}

function Feature({ title, body }) {
  return (
    <div className="border-l-2 border-gold pl-4">
      <h3 className="font-bold mb-1">{title}</h3>
      <p className="text-sm text-charcoal/80">{body}</p>
    </div>
  );
    }
