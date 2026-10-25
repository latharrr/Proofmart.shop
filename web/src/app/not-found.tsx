import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";
import RequestedPath from "@/components/account/requested-path";
import NotFoundAuth from "@/components/account/not-found-auth";

export default function NotFound() {
  // Intentionally sync with no session read: an async getClaims here made
  // the shared not-found boundary dynamic and silently opted every route
  // out of static prerendering. The signed-in/out swap lives in
  // NotFoundAuth on the client.
  return (
    <div className="pm-page">
      <Topbar />
      <main id="main">
        <section className="pm-wrap pm-nf" aria-labelledby="pm-nf-title">
          <div className="pm-nf-text">
            {/* A missing page is not a verdict about anyone's document, so
                nothing here takes a pencil colour. */}
            <h1 id="pm-nf-title" className="pm-nf-title">
              Page not found.
            </h1>
            <div>
              <p className="pm-h-lead pm-nf-lead">
                Nothing is published at <RequestedPath />. The link may be mistyped or out of date. Everything else on ProofMart is working normally.
              </p>
              <NotFoundAuth />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
