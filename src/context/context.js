import React, { useState, useEffect, useContext } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  //request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  //error handling
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (username) => {
    toggleError();
    setIsLoading(true);

    const response = await axios(`${rootUrl}/users/${username}`).catch(
      (err) => {
        console.log(err);
      }
    );

    if (response) {
      setGithubUser(response.data);
      const { login, followers_url } = response.data;

      //repos
      // axios(`${rootUrl}/users/${login}/repos?per_page=100`).then((response) => {
      //   setRepos(response.data);
      // });
      // //followers
      // axios(`${followers_url}?per_page=100`).then((response) => {
      //   setFollowers(response.data);
      // });
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user with that name");
    }

    // const res2 = await axios.get(`${rootUrl}/users/${username}/repos`);
    // setRepos(res2.data);
    // const res3 = await axios.get(`${rootUrl}/users/${username}/followers`);
    // setFollowers(res3.data);
    checkRate();
    setIsLoading(false);
  };
  //check rate
  const checkRate = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "Rate limit exceeded");
        }
      })
      .catch((error) => console.log(error));
  };

  const toggleError = (show = false, msg = "") => {
    setError({ show, msg });
  };

  useEffect(checkRate, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
        toggleError,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};
export const useGlobalContext = () => {
  return useContext(GithubContext);
};

export { GithubContext, GithubProvider };
