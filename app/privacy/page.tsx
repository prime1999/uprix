import Link from "next/link";

const sections = [
  {
    title: "1. Introduction",
    content: (
      <>
        <p>
          Uprix (“we,” “our,” or “us”) respects your privacy. This Privacy
          Policy explains how we collect, use, store, and share information when
          you access our website at https://uprix.win or use our products and
          services.
        </p>
        <p>
          Uprix is operated by a community and team rather than a formally
          incorporated legal entity. References to “Uprix” in this policy
          describe the platform and the people responsible for operating it.
        </p>
        <p>
          Different products may process different categories of information.
          Where additional product-specific privacy information is necessary, we
          will provide it as appropriate.
        </p>
      </>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <>
        <p>
          The information we collect depends on which Uprix products and
          services you use. It may include the following categories.
        </p>
        <h3 className="font-semibold text-foreground">
          Account and profile information
        </h3>
        <p>
          Information such as your name, email address, authentication
          identifiers, and profile details that you provide or that are
          associated with your account.
        </p>
        <h3 className="font-semibold text-foreground">
          Payment and transaction information
        </h3>
        <p>
          Transaction references, payment amounts, payment status, and related
          records needed to verify purchases, manage access, and resolve payment
          issues. Payment providers may process additional information under
          their own privacy practices.
        </p>
        <h3 className="font-semibold text-foreground">
          Content and submissions
        </h3>
        <p>
          Information you choose to submit through our products, including
          written updates, images, documents, feedback, and other uploaded
          materials.
        </p>
        <h3 className="font-semibold text-foreground">
          Product and participation records
        </h3>
        <p>
          Depending on the product, we may process records relating to
          membership, progress, reviews, activity, programme participation, and
          administrative decisions.
        </p>
        <h3 className="font-semibold text-foreground">
          Technical and usage information
        </h3>
        <p>
          Technical information may be processed by our infrastructure and
          service providers to deliver, secure, troubleshoot, and maintain the
          platform. The information collected depends on the tools and features
          in use.
        </p>
        <p>
          Please do not submit passwords, full payment-card details, or
          sensitive information unless a supported feature specifically requires
          it.
        </p>
      </>
    ),
  },
  {
    title: "3. How We Use Information",
    content: (
      <>
        <p>We may use information, as appropriate, to:</p>
        <ul>
          <li>Create, authenticate, and manage user accounts.</li>
          <li>Provide products, features, and services you request.</li>
          <li>Process purchases and verify payment status.</li>
          <li>Store, display, and manage content you submit.</li>
          <li>Support product features, reviews, and collaboration.</li>
          <li>Maintain relevant participation and transaction records.</li>
          <li>Respond to questions, complaints, and support requests.</li>
          <li>Investigate suspected fraud, abuse, or security incidents.</li>
          <li>Maintain, troubleshoot, and improve our services.</li>
          <li>Comply with applicable legal obligations.</li>
        </ul>
        <p>
          We seek to use information for purposes that are relevant to providing
          and protecting the service in question.
        </p>
      </>
    ),
  },
  {
    title: "4. How We Share Information",
    content: (
      <>
        <p>
          We do not sell personal information to advertisers. We may share
          information in the following circumstances.
        </p>
        <h3 className="font-semibold text-foreground">Service providers</h3>
        <p>
          We use service providers to support hosting, authentication, payments,
          file storage, image delivery, and other platform functions. They may
          process information as needed to provide their services.
        </p>
        <h3 className="font-semibold text-foreground">
          Product participants and authorised reviewers
        </h3>
        <p>
          Some products may allow other participants, collaborators, reviewers,
          or administrators to access information you submit. Access depends on
          the product's features and intended purpose. Please review the
          relevant product information before sharing content.
        </p>
        <h3 className="font-semibold text-foreground">
          Legal and safety requirements
        </h3>
        <p>
          We may disclose information where we reasonably believe disclosure is
          necessary to comply with applicable law, respond to valid legal
          requests, protect users, investigate fraud, or protect the rights and
          security of Uprix and others.
        </p>
        <h3 className="font-semibold text-foreground">
          Business or operational changes
        </h3>
        <p>
          If responsibility for a product or service changes, relevant
          information may be transferred where lawful and appropriate, with any
          required notice or consent.
        </p>
      </>
    ),
  },

  {
    title: "5. Data Retention",
    content: (
      <>
        <p>
          We retain personal information for as long as reasonably necessary for
          the purposes described in this policy, including providing services,
          maintaining accounts and transaction records, resolving disputes,
          protecting the platform, and meeting legal obligations.
        </p>
        <p>
          Retention periods may differ by information type and product. We do
          not specify a universal deletion period because different records may
          have different operational or legal requirements.
        </p>
        <p>
          Deleting an account or removing information from one part of Uprix may
          not immediately remove copies held in backups, audit records, or
          third-party storage. Where applicable, we will handle deletion
          requests in accordance with the law and our retention practices.
        </p>
      </>
    ),
  },
  {
    title: "6. Security",
    content: (
      <>
        <p>
          We use technical and organisational measures intended to protect
          information from unauthorised access, loss, misuse, alteration, or
          disclosure.
        </p>
        <p>
          No website, transmission method, or storage system can be guaranteed
          completely secure. We therefore cannot promise absolute security.
        </p>
        <p>
          You are responsible for protecting your account credentials and
          notifying us if you suspect unauthorised access to your account.
        </p>
      </>
    ),
  },
  {
    title: "7. Your Privacy Rights and Choices",
    content: (
      <>
        <p>
          Depending on applicable law and the circumstances of the processing,
          you may have rights to request access to personal information,
          correction of inaccurate information, deletion, restriction of certain
          processing, or other available remedies.
        </p>
        <p>
          You can contact us to ask about your information or make a privacy
          request. We may need to verify your identity before acting on a
          request.
        </p>
        <p>
          Some information may need to be retained for legitimate operational,
          security, dispute-resolution, or legal reasons. We will explain
          relevant limitations where appropriate.
        </p>
        <p>
          To make a request, email{" "}
          <a
            href="mailto:uprixdevsquad@gmail.com"
            className="font-medium text-primary underline underline-offset-4"
          >
            uprixdevsquad@gmail.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "8. Children's Privacy",
    content: (
      <>
        <p>
          Uprix's products are intended for people who are legally permitted to
          use the relevant service. Some products may have additional age or
          eligibility requirements.
        </p>
        <p>
          Where a service is not intended for children or requires parental
          consent, the applicable requirements should be followed. If you
          believe a child has provided personal information inappropriately,
          contact us so we can review the situation.
        </p>
      </>
    ),
  },
  {
    title: "9. International Processing",
    content: (
      <>
        <p>
          Some of our service providers may process or store information in
          countries other than the country in which you live. The location
          depends on the provider, service configuration, and product.
        </p>
        <p>
          Where applicable, we will handle international transfers in accordance
          with relevant legal requirements.
        </p>
      </>
    ),
  },
  {
    title: "10. Changes to This Privacy Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy as Uprix's products, providers, or
          practices change. The current version will be published on this page
          with an updated date.
        </p>
        <p>
          Where required, we will provide notice of material changes or obtain
          any necessary consent.
        </p>
      </>
    ),
  },
  {
    title: "11. Contact Us",
    content: (
      <>
        <p>
          For privacy questions, data requests, or concerns about this policy,
          contact Uprix:
        </p>
        <p>
          <span className="font-medium text-foreground">Email: </span>
          <a
            href="mailto:uprixdevsquad@gmail.com"
            className="text-primary underline underline-offset-4"
          >
            uprixdevsquad@gmail.com
          </a>
        </p>
        <p>
          <span className="font-medium text-foreground">Website: </span>
          <a
            href="https://uprix.win"
            className="text-primary underline underline-offset-4"
          >
            uprix.win
          </a>
        </p>
        <p>
          Please do not send passwords or full payment-card details by email.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <header className="mb-12 border-b border-border pb-10 sm:mb-16">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Legal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            How Uprix collects, uses, stores, and protects information across
            its products and services.
          </p>

          <p className="mt-5 text-sm text-muted-foreground">
            Last updated: October 10, 2026
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="h-fit lg:sticky lg:top-8">
            <nav aria-label="Privacy Policy sections">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                On this page
              </h2>

              <ol className="space-y-2 border-l border-border pl-4">
                {sections.map((section, index) => (
                  <li key={section.title}>
                    <a
                      href={`#section-${index + 1}`}
                      className="block py-1 text-sm leading-5 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {section.title.replace(/^\d+\.\s*/, "")}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0">
            <div className="mb-10 rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
              <p className="text-sm leading-6 text-muted-foreground">
                This policy applies across Uprix. Individual products may
                provide additional privacy information where their features
                require it.
              </p>
            </div>

            <div className="space-y-12 sm:space-y-14">
              {sections.map((section, index) => (
                <section
                  key={section.title}
                  id={`section-${index + 1}`}
                  className="scroll-mt-8"
                >
                  <h2 className="mb-5 text-xl font-semibold tracking-tight sm:text-2xl">
                    {section.title}
                  </h2>

                  <div className="space-y-4 text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8 [&_h3]:mb-2 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            <footer className="mt-16 border-t border-border pt-8">
              <p className="text-sm leading-6 text-muted-foreground">
                Questions about your privacy? Email{" "}
                <a
                  href="mailto:uprixdevsquad@gmail.com"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  uprixdevsquad@gmail.com
                </a>
                .
              </p>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <Link
                  href="/terms"
                  className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Terms of Service
                </Link>

                <Link
                  href="/"
                  className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Back to Uprix
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </main>
  );
}
