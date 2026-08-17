import { domains, siteConfig } from "./domains.js";

export function formatPrice(price, currency = "CNY") {
  if (!Number.isFinite(price)) return "询价";

  return new Intl.NumberFormat(currency === "CNY" ? "zh-CN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function buildInquiryLink(email, domainName = "感兴趣的域名") {
  const subject = `域名询价 / Domain enquiry: ${domainName}`;
  const body = `你好，我对 ${domainName} 感兴趣。\nHello, I am interested in ${domainName}.\n\n我的报价 / 预算 / Offer or budget:\n用途简介 / Intended use:\n联系方式 / Contact details:`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function filterDomains(items, category = "全部", query = "") {
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  return items.filter((item) => {
    const matchesCategory = category === "全部" || item.category === category;
    const searchable = [item.name, item.category, item.categoryEn, item.description, item.descriptionEn, ...item.tags].join(" ").toLocaleLowerCase("zh-CN");
    return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
}

function splitDomain(name) {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex <= 0) return [name, ""];
  return [name.slice(0, dotIndex), name.slice(dotIndex)];
}

function domainCard(domain) {
  const [label, extension] = splitDomain(domain.name);
  const article = document.createElement("article");
  article.className = "domain-card";
  article.innerHTML = `
    <div class="domain-identity">
      <div class="domain-name-row">
        <h3><span>${label}</span><b>${extension}</b></h3>
        ${domain.featured ? '<span class="featured-badge">精选 / Featured</span>' : ""}
      </div>
      <p>${domain.description}<span class="copy-en" lang="en">${domain.descriptionEn}</span></p>
      <ul class="tag-list" aria-label="域名标签">
        ${domain.tags.map((tag) => `<li>${tag}</li>`).join("")}
      </ul>
    </div>
    <div class="domain-offer">
      <span class="category-label">${domain.category} / ${domain.categoryEn}</span>
      <strong>${formatPrice(domain.price, siteConfig.currency)}<small> / Make an offer</small></strong>
      <a href="${buildInquiryLink(siteConfig.contactEmail, domain.name)}" aria-label="询价 / Make an offer ${domain.name}">
        询价 / Enquire <span aria-hidden="true">↗</span>
      </a>
    </div>
  `;
  return article;
}

function init() {
  const domainList = document.querySelector("#domain-list");
  const count = document.querySelector("#domain-count");
  const emptyState = document.querySelector("#empty-state");
  const filterList = document.querySelector("#filter-list");
  const search = document.querySelector("#domain-search");
  const categories = ["全部", ...new Set(domains.map((domain) => domain.category))];
  let activeCategory = "全部";

  document.querySelectorAll("[data-brand-name]").forEach((node) => {
    node.textContent = siteConfig.brandName;
  });
  document.querySelector("#contact-email").textContent = siteConfig.contactEmail;
  document.querySelector("#email-contact").href = buildInquiryLink(siteConfig.contactEmail);
  document.querySelector("#current-year").textContent = new Date().getFullYear();

  const requestedDomain = new URLSearchParams(window.location.search).get("domain");
  if (requestedDomain && domains.some((domain) => domain.name === requestedDomain)) {
    search.value = requestedDomain;
  }

  function render() {
    const visibleDomains = filterDomains(domains, activeCategory, search.value);
    domainList.replaceChildren(...visibleDomains.map(domainCard));
    count.textContent = visibleDomains.length;
    emptyState.hidden = visibleDomains.length !== 0;
  }

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = `${category} / ${domains.find((domain) => domain.category === category)?.categoryEn ?? "All"}`;
    button.setAttribute("aria-pressed", String(category === activeCategory));
    button.addEventListener("click", () => {
      activeCategory = category;
      filterList.querySelectorAll("button").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      render();
    });
    filterList.append(button);
  });

  search.addEventListener("input", render);

  render();
}

if (typeof document !== "undefined") init();
