import Link from "next/link";

const sections = [
  {
    title: "1. About Uprix",
    content: (
      <>
        <p>
          Uprix is a platform that may provide multiple digital products, tools,
          services, and community experiences.
        </p>
        <p>
          Uprix is currently operated by a community and team rather than a
          formally incorporated legal entity. These Terms do not represent that
          Uprix is a registered company.
        </p>
        <p>
          Individual products and services may have additional terms, usage
          rules, eligibility requirements, fees, deadlines, or participation
          conditions. Where applicable, those terms supplement these Terms and
          should be made available before you commit to the relevant product or
          service.
        </p>
      </>
    ),
  },
  {
    title: "2. Eligibility and Accounts",
    content: (
      <>
        <p>
          You must be legally permitted to use the relevant service and enter
          into the applicable agreement. Where required, a parent or legal
          guardian must provide the necessary consent.
        </p>
        <p>When creating or maintaining an account, you agree to:</p>
        <ul>
          <li>
            Provide accurate information and keep it reasonably up to date.
          </li>
          <li>Keep your login credentials secure.</li>
          <li>Use your own account and not impersonate another person.</li>
          <li>Notify us if you suspect unauthorised access to your account.</li>
          <li>
            Avoid attempts to bypass authentication, payment verification, or
            access controls.
          </li>
        </ul>
        <p>
          You are responsible for activity conducted through your account to the
          extent permitted by applicable law. We may investigate suspicious
          activity and take reasonable measures to protect accounts and the
          platform.
        </p>
      </>
    ),
  },
  {
    title: "3. Products, Services, and Availability",
    content: (
      <>
        <p>
          Uprix may introduce, modify, update, suspend, or discontinue products
          and features as the platform develops.
        </p>
        <p>
          Product descriptions, prices, eligibility requirements, and material
          conditions should be presented before you purchase or use a product,
          where applicable.
        </p>
        <p>
          We aim to keep Uprix available and functioning properly but do not
          guarantee uninterrupted or error-free operation. We may perform
          maintenance, address security issues, or modify features where
          reasonably necessary to operate the platform.
        </p>
        <p>
          Where a change materially affects an existing paid service or a user's
          obligations, we will handle the change consistently with the
          applicable product terms and applicable law.
        </p>
      </>
    ),
  },
  {
    title: "4. Payments and Fees",
    content: (
      <>
        <p>
          Certain products or services may require payment. Applicable prices
          and payment conditions will be presented before you complete a
          purchase.
        </p>
        <p>
          Payments may be processed by third-party providers, including
          Paystack. Uprix may use transaction references, payment status, and
          related records to verify payments and administer purchases.
        </p>
        <p>
          If a payment is successful but the expected access or service is not
          provided, contact us with the relevant transaction reference so the
          issue can be investigated.
        </p>
        <p>
          You must not falsely claim that a payment was made or attempt to
          manipulate payment records. You retain any rights you have under
          applicable consumer-protection and payment laws.
        </p>
      </>
    ),
  },
  {
    title: "5. Refunds and Cancellations",
    content: (
      <>
        <p>
          Payments are generally non-refundable unless a refund is required by
          applicable law or approved by Uprix as an exception.
        </p>
        <p>
          This general policy does not remove any mandatory cancellation,
          refund, or other consumer rights that may apply to your transaction.
        </p>
        <p>
          Exceptional refund requests may be reviewed individually. Approval is
          not guaranteed. The circumstances of the purchase, the service already
          provided, and any applicable product-specific conditions may be
          considered.
        </p>
        <p>
          If you believe a payment was duplicated, incorrectly recorded,
          unauthorised, or made without the expected service being provided,
          contact us so the transaction can be investigated.
        </p>
        <p>
          Additional refund conditions specific to a product should be made
          available before payment and must not conflict with these Terms or
          applicable law.
        </p>
      </>
    ),
  },
  {
    title: "6. User Accounts and Acceptable Use",
    content: (
      <>
        <p>You agree to use Uprix lawfully and responsibly. You must not:</p>
        <ul>
          <li>
            Use the platform for unlawful, fraudulent, or abusive purposes.
          </li>
          <li>
            Attempt to bypass authentication, payment verification, or access
            controls.
          </li>
          <li>
            Interfere with the security or normal operation of the platform.
          </li>
          <li>Upload malicious files or harmful content.</li>
          <li>
            Impersonate another person or knowingly provide false information.
          </li>
          <li>
            Access, copy, or disclose another person's information without
            authorisation.
          </li>
          <li>Use Uprix to infringe another person's rights.</li>
          <li>
            Deliberately misuse platform features or attempt to disrupt services
            for other users.
          </li>
        </ul>
        <p>
          We may investigate suspected violations and take reasonable action
          under these Terms and any applicable product-specific rules.
        </p>
      </>
    ),
  },
  {
    title: "7. User Content and Submissions",
    content: (
      <>
        <p>
          Some Uprix products may allow users to upload, create, submit, or
          share content, including text, images, documents, and other materials.
        </p>
        <p>
          You retain ownership of the intellectual property rights you already
          hold in content you provide, subject to the rights of other people.
        </p>
        <p>
          By submitting content, you grant Uprix a limited, non-exclusive
          permission to host, store, reproduce, display, and process it as
          reasonably necessary to provide and operate the relevant service,
          support its intended features, maintain records, protect the platform,
          and address disputes.
        </p>
        <p>
          This permission does not transfer ownership of your content to Uprix
          or grant an unrestricted right to sell it or use it for unrelated
          promotional purposes.
        </p>
        <p>
          You are responsible for ensuring that you have the rights and
          permissions necessary to submit content. Do not upload unlawful
          material, malicious files, or another person's private information
          without an appropriate basis.
        </p>
        <p>
          Some products may have additional content rules, storage arrangements,
          or submission conditions. Those rules will apply where presented to
          you.
        </p>
      </>
    ),
  },
  {
    title: "8. Suspension and Termination",
    content: (
      <>
        <p>
          We may restrict or suspend access to an account or product where
          reasonably necessary to:
        </p>
        <ul>
          <li>Address suspected fraud, abuse, or unlawful activity.</li>
          <li>Protect the security and integrity of Uprix.</li>
          <li>Enforce these Terms or applicable product-specific rules.</li>
          <li>Respond to legal obligations or valid legal requests.</li>
        </ul>
        <p>
          Where reasonably practicable, we will communicate the reason for a
          restriction and any available next steps. Any review or appeal process
          may depend on the product and the circumstances.
        </p>
        <p>
          Suspension of access to one product does not necessarily mean that
          your entire Uprix account has been deleted or terminated.
        </p>
        <p>
          Any effects on paid access, outstanding obligations, or refunds will
          be handled according to the applicable product terms and applicable
          law. Nothing in this section removes rights that cannot lawfully be
          excluded.
        </p>
      </>
    ),
  },
  {
    title: "9. Privacy and Data Handling",
    content: (
      <>
        <p>
          Uprix processes information needed to operate accounts, deliver
          products, administer purchases, support product features, maintain
          records, and protect the platform.
        </p>
        <p>
          Depending on the service, providers may include Supabase for
          authentication and database services, Paystack for payments,
          Cloudinary for image hosting, Google Drive for file storage, and
          website hosting or infrastructure providers.
        </p>
        <p>
          Our Privacy Policy explains how personal information is collected,
          used, stored, shared, and retained, as well as how to contact us about
          privacy requests.
        </p>
        <p>
          <Link
            href="/privacy"
            className="font-medium text-primary underline underline-offset-4 transition-opacity hover:opacity-75"
          >
            Read our Privacy Policy
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    title: "10. Third-Party Services",
    content: (
      <>
        <p>
          Uprix may rely on third-party services for payments, authentication,
          storage, hosting, analytics, and other functions. Those services may
          have their own terms, privacy policies, and availability limitations.
        </p>
        <p>
          We will take reasonable steps to maintain the platform, but we cannot
          guarantee uninterrupted operation or eliminate every disruption caused
          by third-party providers.
        </p>
        <p>
          This section does not exclude responsibility that cannot lawfully be
          excluded.
        </p>
      </>
    ),
  },
  {
    title: "11. Intellectual Property",
    content: (
      <>
        <p>
          Uprix's platform, branding, design, original materials, and other
          content may be protected by applicable intellectual property laws.
        </p>
        <p>
          Except where permitted by law or expressly authorised by Uprix, you
          may not reproduce, redistribute, modify, or commercially exploit
          protected platform materials without the necessary permission.
        </p>
        <p>
          These Terms do not give Uprix ownership of content you independently
          create and submit, beyond the limited permissions described in these
          Terms and any applicable product-specific terms.
        </p>
      </>
    ),
  },
  {
    title: "12. Disputes and Applicable Law",
    content: (
      <>
        <p>
          If you have a concern about a purchase, account, product, or another
          aspect of Uprix, please contact us first so we can attempt to resolve
          it.
        </p>
        <p>
          Nothing in these Terms prevents you from exercising rights available
          under applicable law or approaching a competent authority where
          appropriate.
        </p>
        <p>
          The applicable governing law and formal dispute-resolution
          arrangements should be specified after confirming the legal
          circumstances of the platform's operators and obtaining appropriate
          advice.
        </p>
      </>
    ),
  },
  {
    title: "13. Changes to These Terms",
    content: (
      <>
        <p>
          We may revise these Terms as Uprix develops. The current version will
          be published at{" "}
          <Link
            href="/terms"
            className="font-medium text-primary underline underline-offset-4"
          >
            uprix.win/terms
          </Link>
          .
        </p>
        <p>
          Where a change materially affects users' rights or obligations, we
          will provide appropriate notice where required. Continued use after
          changes take effect will be treated in accordance with applicable law.
        </p>
      </>
    ),
  },
  {
    title: "14. Contact Uprix",
    content: (
      <>
        <p>
          For questions about these Terms, payments, accounts, products, or
          access to services, contact us:
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

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <header className="mb-12 border-b border-border pb-10 sm:mb-16">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Legal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Terms of Service
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The terms that apply when you access or use Uprix and its products
            and services.
          </p>

          <p className="mt-5 text-sm text-muted-foreground">
            Last updated: October 10, 2026
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <aside className="h-fit lg:sticky lg:top-8">
            <nav aria-label="Terms of Service sections">
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
                Please read these Terms carefully. Individual Uprix products may
                have additional terms that apply alongside this platform-wide
                agreement.
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

                  <div className="space-y-4 text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:break-words [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            <footer className="mt-16 border-t border-border pt-8">
              <p className="text-sm leading-6 text-muted-foreground">
                Questions about these Terms? Contact{" "}
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
                  href="/privacy"
                  className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                >
                  Privacy Policy
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
