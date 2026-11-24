import Link from "next/link";
import { allPages } from "@/lib/pages";
import { site } from "@/lib/site";

const buttonClass = "mt-6 inline-flex rounded-full bg-[var(--green)] px-5 py-3 font-bold text-white";

const blogPosts = allPages.filter((page) => page.postType === "post" && page.language === "en").slice(0, 3);

const steps = [
  "Send us the photos or video of items via WhatsApp (852) 9847 7838. Our customer service will reply you within seconds.",
  "We will give you a free quote after our assessment of your items. All inclusive price with no hidden fees.",
  "Book appointment with us and we can offer same day service.",
  "Sit back and relax. Our friendly and professional team will do all the heavy lifting.",
];

const features = [
  {
    title: "Fast and Easy",
    text: "We offer same day service and our friendly customer service will help you throughout the process.",
    image: "https://speedy-move.com/wp-content/uploads/Fast-and-easy-service.png",
    alt: "Fast and easy service",
  },
  {
    title: "Professional Service",
    text: "Speedy movers have over 10 years of experience. We arrive on time with a smile, work efficiently, treat you and your items with care and respect.",
    image: "https://speedy-move.com/wp-content/uploads/professional-mover.png",
    alt: "professional mover",
  },
  {
    title: "Eco-Friendly Removal",
    text: "Our goal is to donate, repurpose, and rehome everything we possibly can, minimizing what ends up in the landfill.",
    image: "https://speedy-move.com/wp-content/uploads/Eco-friendly.png",
    alt: "Eco-friendly junk removal",
  },
];

const services = [
  {
    title: "Junk Removal Service",
    text: "Our professional junk removal teams can help assist with decluttering your home or office by removing just about any unwanted items. Whether you’re preparing for a move, cleaning out an estate, or downsizing, Speedy Move is here to help.",
    href: "/junk-removal/",
    label: "Items We Take",
    image: "https://speedy-move.com/wp-content/uploads/rubbish-removal-2-768x512.webp",
    alt: "rubbish removal",
  },
  {
    title: "Furniture Disposal Service",
    text: "We offer sofa, bed, mattress, wardrobe, television, washing machine, cabinet, refrigerator, dining table set, home appliance and other furniture recycling and disposal service in Hong Kong.",
    href: "/furniture-disposal/",
    label: "Furniture We Take",
    image: "https://speedy-move.com/wp-content/uploads/bed-removal-768x512.webp",
    alt: "bed disposal",
  },
  {
    title: "Moving Service",
    text: "We offer wrap protection, disassembly & assembly, full packing services, point to point moving for residential, commercial and industrial building in Hong Kong.",
    href: "/moving/",
    label: "Moving Process",
    image: "https://speedy-move.com/wp-content/uploads/hero-page-moving-768x512.webp",
    alt: "moving service",
  },
  {
    title: "Demolition & Restoration",
    text: "We offer unauthorized structures demolition, office building demolition, home demolition, shopping mall demolition and restoration, restaurant demolition, factory building demolition, rooftop house demolition.",
    href: "/demolition-and-restoration/",
    label: "Demolition Process",
    image: "https://speedy-move.com/wp-content/uploads/demolition-1-768x512.webp",
    alt: "demolition service",
  },
];

const serviceDetails = [
  {
    title: "Junk Removal",
    text: "Speedy Move offers eco-friendly junk removal and trash pickup services throughout Hong Kong. Once an appointment is scheduled, our experts will pick up any unwanted items and carefully deliver them to designated government garbage collection points, recycle centers or government-approved landfills in cases where the item cannot be reused. We can remove just about any item, including appliances and trash the same-day or next day. Schedule your junk pickup time to get a free, no obligation quote on services now!",
    image: "https://speedy-move.com/wp-content/uploads/rubbish-removal-2-768x512.webp",
    alt: "rubbish removal",
    href: "/junk-removal/",
  },
  {
    title: "Furniture Disposal",
    text: "Our furniture pickup services include single items, bulky furniture and even estate cleanouts. Whether you're in need of sofa removal, mattress disposal, or other junk removal services, we can help! If your used furniture is in good shape, we’ll donate to local charities or recycle if we can to avoid landfills. Our reliable furniture removal includes a free estimate so you know exactly how much it will cost to haul away your unwanted furniture. There are no hidden fees and no obligations. Schedule your furniture pickup time now!",
    image: "https://speedy-move.com/wp-content/uploads/bed-removal-768x512.webp",
    alt: "bed disposal",
    href: "/furniture-disposal/",
  },
  {
    title: "Moving Service",
    text: "Speedy Move offers comprehensive local moving services for residential moving and commercial moving. Our expert movers are professional trained to handle various fragile or heavy items, ensuring your valuables gets from point A to point B exactly how you want them. We work closely with you to determine a custom, upfront moving quote based on your destination and the number of items you're transporting.",
    image: "https://speedy-move.com/wp-content/uploads/hero-page-moving-768x512.webp",
    alt: "moving service",
    href: "/moving/",
  },
  {
    title: "Demolition Service",
    text: "Hiring the Speedy Move team to manage your demolition work is a great way to cut out the middleman with your home renovation projects. At Speedy Move, we’re more than just your average junk removal service. We offer demolition and debris removal services for any room in your home or office. No matter your needs, our team of professional demolition and debris removal specialists are ready to help make your upcoming home improvement project easy.",
    image: "https://speedy-move.com/wp-content/uploads/demolition-1-768x512.webp",
    alt: "demolition service",
    href: "/demolition-and-restoration/",
  },
];

const items = [
  ["Sofa and Couch", "/sofa-removal/", "https://speedy-move.com/wp-content/uploads/sofa-removal-scaled.webp", "sofa removal"],
  ["Bed and Mattress", "/mattress-disposal/", "https://speedy-move.com/wp-content/uploads/mattress-removal-scaled.webp", "mattress removal"],
  ["Wardrobe and Cabinet", "/wardrobe-removal/", "https://speedy-move.com/wp-content/uploads/wardrobe-removal-1-scaled.webp", "wardrobe removal"],
  ["Trash", "/trash-removal/", "https://speedy-move.com/wp-content/uploads/junk-removal-scaled.webp", "junk removal"],
  ["Appliance", "/appliance-removal/", "https://speedy-move.com/wp-content/uploads/appliance-removal-scaled.webp", "appliance removal"],
  ["Television and Electronics", "/television-removal/", "https://speedy-move.com/wp-content/uploads/tv-removal-scaled.webp", "television removal"],
  ["Household Junk", "/trash-removal/", "https://speedy-move.com/wp-content/uploads/household-junk-removal-2-1-scaled.webp", "household junk removal"],
  ["Table and Chair", "/table-desk-removal/", "https://speedy-move.com/wp-content/uploads/table-and-desk-removal-2-scaled.webp", "table and chair removal"],
] as const;

const reviews = [
  {
    name: "Justine SI",
    quote:
      "I’ve used their service twice and they are super reliable and efficient! 1st instance, I had a glass top dining table that got broken and needed to be taken out from my apartment ASAP. They are the only one who can do the job. Took them again as the moving service provider for the new dining table and they never disappoint – on time! Plus, customer service is superb! You can get a reply in less than 5 minutes. Aside from being so efficient, I love how personalized their customer service is which is rare in HK 😃",
  },
  {
    name: "Lila",
    quote:
      "We needed someone to dismantle and dispose of a built in bed with a contained frame a few days before the CNY and knew that this was going to be difficult. After an online search, Speedy Move was the only one who responded without minutes. They quoted us last night and today turned up at the right time and handled the matter super efficiently.. we were very impressed!! Would definitely recommend to others as we certainly will. Don’t worry they communicate perfectly in English too. No problem!",
  },
  {
    name: "Jonathan K.",
    quote:
      "I sent a message via WhatsApp, got a reply within a couple of minutes, and 2 hours later a sofa and a pair of futons that had been cluttering up my new flat had been swiftly and efficiently collected. Really fantastic service, very professional and courteous; Speedy Move (they really live up to their name) will be my go-to outfit for moving or discarding anything in the future.",
  },
];

const priceFactors = [
  "Amount of junk",
  "Single-item pricing",
  "Heavy items",
  "Location",
  "Disposal fees",
  "Time of year",
  "Accessibility",
];

export const faqs = [
  {
    question: "Can I get an exact price before you arrive?",
    answer:
      "At Speedy Move, we understand that you may want to know the cost of our removal service upfront. We’re pleased to offer an estimate process that provides a more accurate price even before our team arrives. You can get a better idea of the expected cost by simply sharing photos of the items you need to be removed, along with your address. This enables us to assess the volume and nature of your furniture items, allowing us to provide a more precise estimate over the phone. To utilize this option, contact our customer support team, and we’ll guide you through the process of submitting photos and your address. This way, you can enjoy clarity and peace of mind regarding the cost well in advance of the furniture removal. Speedy Move is dedicated to ensuring a straightforward and transparent experience for our valued customers.",
  },
  {
    question: "How do I cancel or change my appointment with Speedy Move?",
    answer:
      "You can change or cancel your appointment at any time. Just give us a call at +852 9847 7838, and we’ll be happy to assist you with any necessary changes.",
  },
  {
    question: "Do you service my region/location?",
    answer:
      "Speedy Move covers all area across Hong Kong. To check if we service your area, you can start a booking by letting us know your location’s details.",
  },
  {
    question: "What methods of payment does Speedy Move accept?",
    answer:
      "At Speedy Move, we accept Payme, FPS, Alipay, Credit Card, Bank Transfer and other electronic payments as payment methods.",
  },
  {
    question: "What are Speedy Move's hours of operation?",
    answer:
      "At Speedy Move, we understand that your furniture removal and cleaning needs may arise at any time. That’s why we’re available around the clock, 24/7, to serve you. Our customer support call center is open 24 hours a day, 7 days a week. You can book appointments online at any time, we’re here to meet your furniture removal and cleaning needs at your convenience. Your satisfaction is our priority, and we’re dedicated to making your space cleaner and more organized whenever you need us.",
  },
];

const junkTypes = [
  { title: "Appliances", items: ["Air conditioners", "Dishwashers", "Washer and dryer machines", "Microwaves", "Stoves and ovens"] },
  { title: "Furniture", items: ["Couches and sofas", "Wardrobes", "Beds", "Dining tables", "Massage chairs"] },
  { title: "Mattresses", items: ["Foam mattresses", "Box springs", "Gel and pillow top mattresses", "Memory foam mattresses"] },
  { title: "Refrigerators", items: ["Top freezer refrigerators", "Side-by-side fridges", "Mini fridges", "Wine cellars"] },
  { title: "Televisions", items: ["LED or LCD TVs", "Smart TVs", "Projectors", "Wall mounts"] },
  { title: "Renovation", items: ["Concrete", "Insulation", "Broken glass", "Mirrors", "Scrap metal"] },
];

function QuoteLink({ children, className }: { children: string; className?: string }) {
  return (
    <a href={site.whatsapp} className={className}>
      {children}
    </a>
  );
}

export function HomePage() {
  return (
    <>
      <section className="relative isolate flex min-h-[80vh] items-center overflow-hidden bg-[var(--moss)] text-white">
        <img
          src="https://speedy-move.com/wp-content/uploads/junk-removal-hero-page-1536x1024.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">We Clear Junk Fast!</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-6xl">
            Your Trusted Junk Removal and Moving Expert in Hong Kong
          </h1>
          <QuoteLink className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-bold text-[var(--moss)]">
            Get a Quote
          </QuoteLink>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold">How Our Service Works</h2>
          <ol className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--green)] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="leading-7">{step}</p>
              </li>
            ))}
          </ol>
          <QuoteLink className={buttonClass}>Book Now!</QuoteLink>
        </div>
        <img
          src="https://speedy-move.com/wp-content/uploads/how-our-service-works-1536x864.jpg"
          alt="how our service works"
          className="h-full max-h-[420px] w-full rounded-3xl object-cover"
        />
      </section>

      <section className="bg-[var(--sand)]">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-3xl bg-white p-6">
              <img src={feature.image} alt={feature.alt} className="h-10 w-10" />
              <h2 className="mt-4 text-xl font-extrabold">{feature.title}</h2>
              <p className="mt-2 leading-7">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold">Our Services</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {services.map((service) => (
            <article key={service.title} className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white">
              <img src={service.image} alt={service.alt} className="h-52 w-full object-cover" />
              <div className="p-6">
                <h3 className="text-2xl font-extrabold">{service.title}</h3>
                <p className="mt-3 leading-7">{service.text}</p>
                <Link href={service.href} className={buttonClass}>
                  {service.label}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--sand)]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold">
            We Move What You Want
            <br />
            Remove What You Don&apos;t
          </h2>
          <p className="mt-4 leading-7">
            Speedy Move will take the weight off your shoulders with our{" "}
            <Link href="/junk-removal/" className="font-bold text-[var(--green)]">
              stress-free junk removal
            </Link>{" "}
            and{" "}
            <Link href="/moving/" className="font-bold text-[var(--green)]">
              moving services
            </Link>
            . We offer comprehensive packages, item transport, packing, and unloading services. We even provide free
            packing materials to get you started.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-16">
          {serviceDetails.map((detail) => (
            <article key={detail.title} className="grid items-center gap-6 rounded-3xl bg-white p-4 md:grid-cols-2 md:p-6">
              <img src={detail.image} alt={detail.alt} className="h-64 w-full rounded-2xl object-cover" />
              <div>
                <h2 className="text-3xl font-extrabold">{detail.title}</h2>
                <p className="mt-4 leading-7">{detail.text}</p>
                <QuoteLink className={buttonClass}>Get a Quote</QuoteLink>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold">Common Items We Remove</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map(([title, href, image, alt]) => (
            <Link key={title} href={href} className="group relative block overflow-hidden rounded-2xl">
              <img src={image} alt={alt} className="h-44 w-full object-cover transition group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
              <span className="absolute bottom-3 left-3 right-3 text-lg font-extrabold text-white">{title}</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/junk-removal/" className={buttonClass}>
            Items We Take
          </Link>
        </div>
      </section>

      <section className="bg-[var(--sand)]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-extrabold">Hear From Our Happy Clients</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {reviews.map((review) => (
              <figure key={review.name} className="rounded-3xl bg-white p-6">
                <p className="text-sm font-bold text-[var(--green)]">5.0</p>
                <blockquote className="mt-3 leading-7">{review.quote}</blockquote>
                <figcaption className="mt-4 font-extrabold">{review.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[var(--moss)] text-white">
        <img
          src="https://speedy-move.com/wp-content/uploads/Hong-Kong-Commercial-Times-Business-Awards-2024.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="text-2xl font-extrabold leading-snug md:text-3xl">
            Hong Kong Commercial Times Business Awards 2024
            <br />
            Most Outstanding Moving Service
            <br />
            Speedy Move Company Limited
          </h2>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
        <img
          src="https://speedy-move.com/wp-content/uploads/Speedy-Truck-1-768x432.png"
          alt="Speedy Move Truck"
          className="w-full rounded-3xl object-cover"
        />
        <div>
          <h2 className="text-3xl font-extrabold">Hong Kong&apos;s Most Trusted Name in Junk Removal</h2>
          <p className="mt-4 leading-7">
            Speedy Move is a full-service junk removal and moving company serving areas throughout Hong Kong. We offer
            junk removal, furniture disposal, demolition and moving service for homes and businesses as well, including
            offices, retail properties, construction sites, and more!
          </p>
          <p className="mt-4 leading-7">
            Our friendly, uniformed teams can help you move anything you want and get rid of anything you don&apos;t
            want. We care about the environment and are committed to safe and responsible disposal, keeping items out of
            the landfill wherever possible.
          </p>
          <Link href="/our-story/" className={buttonClass}>
            More about Us
          </Link>
        </div>
      </section>

      <section className="bg-[var(--sand)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold">Find Speedy Move Near You</h2>
            <p className="mt-4 leading-7">
              Speedy Move is the #1 rated junk removal service provider in Hong Kong, operating in all 18 districts of
              Hong Kong. We offers fair, up-front pricing, will call you 15-30 minutes ahead of every job and leave your
              home or business cleaner than when we arrived! Find Speedy Move near you today and experience the
              difference!
            </p>
            <Link href="/locations/" className={buttonClass}>
              Our Locations
            </Link>
          </div>
          <div>
            <h2 className="text-3xl font-extrabold">Junk Removal Pricing</h2>
            <p className="mt-4 leading-7">
              We take pride in offering clear and easy-to-understand pricing. Before we begin you will always receive a
              free, no obligation estimate for the removal and disposal or donation of any item. The following factors
              impact how much we charge for junk removal:
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
              {priceFactors.map((factor) => (
                <li key={factor} className="rounded-full bg-white px-3 py-2">
                  {factor}
                </li>
              ))}
            </ul>
            <Link href="/pricing/" className={buttonClass}>
              Our Pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-16 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold">Recycle and Donate Used Furniture</h2>
          <p className="mt-4 leading-7">
            At Speedy Move, we do our best to recycle and donate items as many items as possible. We work with community
            centers, non-profit organizations, and donation centers to pass on items after we haul them away. You can
            rest assured that your items will be handled responsibly by our teams, in an effort to reduce our
            environmental impact.
          </p>
          <ul className="mt-4 space-y-3 leading-7">
            <li>
              <strong>Furniture for Families:</strong> We help donate second hand furniture to support local communities
              and contribute to a better Hong Kong.
            </li>
            <li>
              <strong>Sustainability:</strong> Promoting eco-friendly practices and reducing waste.
            </li>
            <li>
              <strong>Cash Back Incentives:</strong> Limited offer to receive financial rewards for your charitable act.
            </li>
          </ul>
          <Link href="/donation/" className={buttonClass}>
            Donation Process
          </Link>
        </div>
        <img
          src="https://speedy-move.com/wp-content/uploads/furniture-donation-1536x1024.png"
          alt="furniture donation"
          className="w-full rounded-3xl object-cover"
        />
      </section>

      <section className="bg-[var(--sand)]">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-center text-3xl font-extrabold">FAQ (Frequently Ask Question)</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl bg-white p-5">
                <summary className="cursor-pointer text-lg font-extrabold">{faq.question}</summary>
                <p className="mt-3 leading-7">{faq.answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/faq/" className={buttonClass}>
              More FAQ
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold">We Take All Kinds of Junk</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {junkTypes.map((group) => (
            <article key={group.title} className="rounded-3xl border border-[var(--line)] p-5">
              <h3 className="text-xl font-extrabold">{group.title}</h3>
              <ul className="mt-3 space-y-1 leading-7">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--sand)]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold">Blog</h2>
          <ul className="mt-6 space-y-3 text-left text-lg font-bold">
            {blogPosts.map((post) => (
              <li key={post.path}>
                <Link href={post.path} className="text-[var(--green)]">
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/blog/" className={buttonClass}>
            More Blog
          </Link>
        </div>
      </section>

      <section className="bg-[var(--moss)] text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="text-3xl font-extrabold">Contact Info</h2>
          <p className="mt-4 text-lg">WhatsApp or Call: {site.phoneDisplay}</p>
          <p className="mt-2">{site.address}</p>
          <p className="mt-2">{site.email}</p>
          <QuoteLink className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-bold text-[var(--moss)]">
            WhatsApp us now
          </QuoteLink>
        </div>
      </section>
    </>
  );
}
