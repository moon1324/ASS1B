import React, { useState, useEffect } from "react";
import SearchBar from "../../components/SearchBar";
import axios from "axios";
import SortableTable from "../../components/table/SortableTable";
import pageStyle from "../../styles/pages.module.scss";
import searchCSS from "../../styles/search.module.scss";

interface ArticlesInterface {
  title: string;
  authors: string[];
  journalName: string;
  pubYear: string;
  volume: string;
  pages: string;
  doi: string;
  method: string;
  claims: string;
  isForClaim: string;
  strengthOfClaim: string;
  evidence: string;
  isApprovedByModerator: boolean;
  isRejectedByModerator: boolean;
  isApprovedByAnalyst: boolean;
  isRejectedByAnalyst: boolean;
}
// type ArticlesProps = {
//   articles: ArticlesInterface[];
// };

const SearchPage: React.FC = () => {
  const headers: { key: keyof ArticlesInterface; label: string }[] = [
    { key: "title", label: "Title" },
    { key: "authors", label: "Authors" },
    { key: "journalName", label: "Journal Name" },
    { key: "pubYear", label: "Publication Year" },
    { key: "volume", label: "Volume" },
    { key: "pages", label: "Pages" },
    { key: "doi", label: "DOI" },
    { key: "method", label: "Method" },
    { key: "claims", label: "Claim" },
    { key: "isForClaim", label: "For/Against Claim" },
    { key: "strengthOfClaim", label: "Strength Of Claim" },
    { key: "evidence", label: "evidence" },
    { key: "isApprovedByModerator", label: "" },
    { key: "isRejectedByModerator", label: "" },
    { key: "isApprovedByAnalyst", label: "" },
    { key: "isRejectedByAnalyst", label: "" },
  ];
  const filteredHeaders = headers.filter(
    (header) =>
      !header.key.startsWith("isApproved") &&
      !header.key.startsWith("isRejected")
  );
  const [searchResults, setSearchResults] = useState<ArticlesInterface[]>([]);
  const [articles, setArticles] = useState<ArticlesInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [methodOptions, setMethodOptions] = useState<string[]>([]);
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");

  useEffect(() => {
    // Fetch articles from the API when the component mounts
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/articles`)
      .then((response) => {
        const data = response.data;
        console.log(data);
        const fetchedArticles: ArticlesInterface[] = data.map(
          (article: any) => {
            const transformedArticle: any = {};

            headers.forEach((mapping) => {
              transformedArticle[mapping.key] = article[mapping.key];
            });

            return transformedArticle;
          }
        );
        setArticles(fetchedArticles);
        setIsLoading(false); // Data has been fetched
        const uniqueMethods = Array.from(
          new Set(fetchedArticles.map((article) => article.method))
        );
        setMethodOptions(uniqueMethods);
      })
      .catch((error) => {
        console.error("Error fetching articles:", error);
        setIsLoading(false); // An error occurred while fetching
      });
  }, []);

  const handleSearch = (query: string) => {
    // Filter articles based on the search query, selected method, and year range
    const filteredArticles = articles.filter((article) => {
      const matchesTitle = article.title
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesMethod =
        selectedMethod === "" || article.method === selectedMethod;
      const withinYearRange =
        (startYear === "" ||
          parseInt(article.pubYear.toString()) >= parseInt(startYear)) &&
        (endYear === "" ||
          parseInt(article.pubYear.toString()) <= parseInt(endYear));
      const approvedArticle =
        article.isApprovedByModerator &&
        !article.isRejectedByModerator &&
        article.isApprovedByAnalyst &&
        !article.isRejectedByAnalyst;
      return (
        matchesTitle && matchesMethod && withinYearRange && approvedArticle
      );
    });
    setSearchResults(filteredArticles);
  };

  const handleMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    // Update the selected method filter when the drop-down value changes
    setSelectedMethod(event.target.value);
  };

  const handleStartYearChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // Update the start year when the input value changes
    setStartYear(event.target.value);
  };

  const handleEndYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Update the end year when the input value changes
    setEndYear(event.target.value);
  };

  return (
    <div className={searchCSS.page}>
      <h1>Search Page</h1>
      <div className={searchCSS.searchbar}>
        <SearchBar onSearch={handleSearch} />
      </div>
      <div className={searchCSS.filters}>
        <div className={searchCSS.yearFilter}>
          <label>Filter by Year Range</label>
          <input
            type="text"
            placeholder="Start Year"
            value={startYear}
            onChange={handleStartYearChange}
          />
          <input
            type="text"
            placeholder="End Year"
            value={endYear}
            onChange={handleEndYearChange}
          />
        </div>
        <div className={searchCSS.methodFilter}>
          <label>Filter by Method</label>
          <select onChange={handleMethodChange} value={selectedMethod}>
            <option value="">All Methods</option>
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </div>
      </div>
      <h2>Search Results</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <SortableTable headers={filteredHeaders} data={searchResults} />
      )}
    </div>
  );
};

export default SearchPage;
