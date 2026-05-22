# Feature: Navbar Improvemnet

## Description 
When the user click on a belog details the blog link in the navbar should have active style
I have already put the useEffect there check both mobile and desktop
```js

      useEffect(()=> {
      console.log(activePage);
      console.log(/^\/blog(\/.*)?$/.test(activePage));
      }, [activePage])
      
      const isBlogPage = /^\/blog(\/.*)?$/.test(activePage);
```